import storage from "./storage";
import {
  createRgbAsm,
  createRgbAsmModule,
  createRgbLink,
  createRgbLinkModule,
  createRgbFix,
  createRgbFixModule,
} from "./WasmModuleWrapper";

type CompileDoneCallback = (
  romFile?: Uint8Array,
  startAddress?: number,
  addressToLineMap?: AddressToLineMap
) => void;

type CompileLogCallback = (message: string | null) => void;

type AddressToLineMap = Record<string, [string, number]>;

type CompileErrorType = "error" | "warning";

interface CompileError {
  type: CompileErrorType;
  error: string;
  line: number;
  message: string;
}

let busy = false;
let repeat = false;
let startDelayTimer: number;

let doneCallback: CompileDoneCallback;
let logCallback: CompileLogCallback | null;
let errorList: Array<CompileError> = [];
let romSymbols: Array<string | null> = [];
let ramSymbols: Array<string | null> = [];
let linkOptions: string[] = [];

const lineNumberRegex = /([\w.]+)[\w.:~]*\(([0-9]+)\)/gi;
const symRegex = /^\s*\$([0-9a-f]+) = ([\w\.]+)/;
const sectionTypeBankRegex = /^\s*(\w+) bank #(\d+)/;
const sectionRegex = /^\s*SECTION: \$([0-9a-f]+)-\$([0-9a-f]+)/;
const slackRegex = /^\s*SLACK: \$([0-9a-f]+) bytes/;

/* see: 
  https://gist.github.com/surma/b2705b6cca29357ebea1c9e6e15684cc
  https://github.com/webpack/webpack/issues/7352
*/
const locateFile = (module: any) => (path: string) => {
  if (path.endsWith(".wasm")) {
    return module;
  }
  return path;
};

function logFunction(str: string) {
  if (logCallback) {
    logCallback(str);
  }

  if (
    str.startsWith("error: ") ||
    str.startsWith("ERROR: ") ||
    str.startsWith("warning: ")
  ) {
    let type: CompileErrorType = "error";
    if (str.startsWith("warning: ")) type = "warning";

    const lineNumberMatch = str.matchAll(lineNumberRegex);
    for (const m of lineNumberMatch) {
      const errorLine = parseInt(m[2], 0);
      errorList.push({
        type: type,
        error: m[1],
        line: errorLine,
        message: str,
      });
    }
  }
}

function trigger() {
  if (typeof startDelayTimer != "undefined") {
    clearTimeout(startDelayTimer);
  }
  startDelayTimer = setTimeout(startCompile, 500);
}

async function startCompile() {
  if (logCallback) logCallback(null);

  errorList = [];
  romSymbols = [];
  ramSymbols = [];

  try {
    const objFiles = Object.keys(storage.getFiles())
      .filter((name) => name.endsWith(".asm"))
      .map(runRgbAsm);

    const files = await Promise.all(objFiles);

    const [romFile, mapFile] = await runRgbLink(files);

    const fixedRomFile = await runRgbFix(romFile);

    buildDone(fixedRomFile, mapFile);
  } catch (e) {
    console.log(e);
    buildFailed();
  }
}

async function runRgbAsm(target: string): Promise<Uint8Array> {
  logFunction(`Running: rgbasm -E ${target} -o output.o -Wall`);

  const module = await createRgbAsm({
    locateFile: locateFile(createRgbAsmModule),
    arguments: ["-E", target, "-o", "output.o", "-Wall"],
    preRun: (m: any) => {
      const FS = m.FS;
      FS.mkdir("include");
      for (const [key, value] of Object.entries(storage.getFiles())) {
        FS.writeFile(key, value);
      }
    },
    print: logFunction,
    printErr: logFunction,
    quit: () => {
      throw new Error("Compilation failed");
    },
  });

  if (repeat) {
    throw new Error();
  }
  const FS = module.FS;
  return FS.readFile("output.o");
}

async function runRgbLink(
  objFiles: Uint8Array[]
): Promise<[Uint8Array, string]> {
  const args = ["-o", "output.gb", "--map", "output.map"].concat(linkOptions);
  objFiles.forEach((_, idx) => {
    args.push(`${idx}.o`);
  });
  logFunction(`Running: rgblink ${args.join(" ")}`);

  const module = await createRgbLink({
    locateFile: locateFile(createRgbLinkModule),
    arguments: args,
    preRun: (m: any) => {
      const FS = m.FS;
      objFiles.forEach((_, idx) => {
        FS.writeFile(`${idx}.o`, objFiles[idx]);
      });
    },
    print: logFunction,
    printErr: logFunction,
  });

  if (repeat) {
    throw new Error();
  }
  const FS = module.FS;
  const romFile = FS.readFile("output.gb");
  const mapFile = FS.readFile("output.map", { encoding: "utf8" });

  return [romFile, mapFile];
}

async function runRgbFix(inputRomFile: Uint8Array): Promise<Uint8Array> {
  logFunction("Running: rgbfix -v output.gb -p 0xff");

  const module = await createRgbFix({
    locateFile: locateFile(createRgbFixModule),
    arguments: ["-v", "output.gb", "-p", "0xff"],
    preRun: (m: any) => {
      const FS = m.FS;
      FS.writeFile("output.gb", inputRomFile);
    },
    print: logFunction,
    printErr: logFunction,
  });

  const FS = module.FS;
  return FS.readFile("output.gb");
}

function buildFailed() {
  logFunction("Build failed");
  if (repeat) {
    repeat = false;
    trigger();
  } else {
    busy = false;
    doneCallback();
  }
}

function buildDone(romFile: Uint8Array, mapFile: string) {
  if (repeat) {
    repeat = false;
    trigger();
  } else {
    busy = false;

    let startAddress = 0x100;
    const addrToLine: Record<string, [string, number]> = {};

    let sectionType = "";
    let bankNumber = 0;
    for (const line of mapFile.split("\n")) {
      let m;
      if ((m = symRegex.exec(line))) {
        let addr = parseInt(m[1], 16);
        let sym = m[2];

        if (sym.startsWith("__SEC_")) {
          sym = sym.substr(6);
          let file = sym.substr(sym.indexOf("_") + 1);
          file = file.substr(file.indexOf("_") + 1);
          const lineNumber = parseInt(sym.split("_")[1], 16);
          addr = (addr & 0x3fff) | (bankNumber << 14);
          addrToLine[addr] = [file, lineNumber];
        } else if (
          sym === "emustart" ||
          sym === "emuStart" ||
          sym === "emu_start"
        ) {
          startAddress = addr;
        } else if (addr < 0x8000) {
          addr = (addr & 0x3fff) | (bankNumber << 14);
          romSymbols[addr] = sym;
        } else {
          ramSymbols[addr] = sym;
        }
      } else if ((m = sectionRegex.exec(line))) {
        let startAddress = parseInt(m[1], 16);
        let endAddress = parseInt(m[2], 16) + 1;
        if (startAddress < 0x8000) {
          startAddress = (startAddress & 0x3fff) | (bankNumber << 14);
          endAddress = (endAddress & 0x3fff) | (bankNumber << 14);
          romSymbols[startAddress] = null;
          romSymbols[endAddress] = null;
        } else {
          ramSymbols[startAddress] = null;
          ramSymbols[endAddress] = null;
        }
      } else if ((m = sectionTypeBankRegex.exec(line))) {
        sectionType = m[1];
        bankNumber = parseInt(m[2], 0);
      } else if ((m = slackRegex.exec(line))) {
        const space = parseInt(m[1], 16);
        let total = 0x4000;
        if (sectionType.startsWith("WRAM")) total = 0x1000;
        else if (sectionType.startsWith("HRAM")) total = 127;
        logFunction(
          `Space left: ${sectionType}[${bankNumber}]: ${space}  (${(
            (space / total) *
            100
          ).toFixed(1)}%)`
        );
      }
    }
    logFunction("Build done");
    doneCallback(romFile, startAddress, addrToLine);
  }
}

export default {
  compile: (
    options: string[],
    onCompileDone: CompileDoneCallback,
    onCompileLog?: CompileLogCallback
  ) => {
    doneCallback = onCompileDone;
    linkOptions = options ?? [];
    logCallback = onCompileLog ?? null;

    if (busy) {
      repeat = true;
    } else {
      busy = true;
      trigger();
    }
  },
  getErrors: () => errorList,
  getRomSymbols: () => romSymbols,
  getRamSymbols: () => ramSymbols,
};
