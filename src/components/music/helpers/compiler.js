/* eslint-disable no-cond-assign */
/* eslint-disable camelcase */

import createRgbAsm from "../../../../appData/wasm/rgbds/rgbasm";
import createRgbLink from "../../../../appData/wasm/rgbds/rgblink";
import createRgbFix from "../../../../appData/wasm/rgbds/rgbfix";

import createRgbAsmModule from "../../../../appData/wasm/rgbds/rgbasm.wasm";
import createRgbLinkModule from "../../../../appData/wasm/rgbds/rgblink.wasm";
import createRgbFixModule from "../../../../appData/wasm/rgbds/rgbfix.wasm";

import storage from "./storage";

let busy = false;
let repeat = false;
let start_delay_timer;
let done_callback;
let log_callback;
let error_list = [];
let rom_symbols = [];
let ram_symbols = [];
let link_options = [];

const line_nr_regex = /([\w.]+)[\w.:~]*\(([0-9]+)\)/gi;

/* see: 
  https://gist.github.com/surma/b2705b6cca29357ebea1c9e6e15684cc
  https://github.com/webpack/webpack/issues/7352
*/
const locateFile = (module) => (path) => {
  if (path.endsWith(".wasm")) {
    return module;
  }
  return path;
};

function logFunction(str) {
  if (log_callback) {
    log_callback(str);
  }

  if (
    str.startsWith("error: ") ||
    str.startsWith("ERROR: ") ||
    str.startsWith("warning: ")
  ) {
    let type = "error";
    if (str.startsWith("warning: ")) type = "warning";

    const line_nr_match = str.matchAll(line_nr_regex);
    for (const m of line_nr_match) {
      const error_line = parseInt(m[2], 0);
      error_list.push([type, m[1], error_line, str]);
    }
  }
}

function trigger() {
  if (typeof start_delay_timer != "undefined") {
    clearTimeout(start_delay_timer);
  }
  start_delay_timer = setTimeout(startCompile, 500);
}

function startCompile() {
  if (log_callback) log_callback(null);

  error_list = [];
  rom_symbols = [];
  ram_symbols = [];

  const objFiles = Object.keys(storage.getFiles())
    .filter((name) => name.endsWith(".asm"))
    .map(runRgbAsm);

  Promise.all(objFiles)
    .then((files) => {
      return runRgbLink(files);
    })
    .then(([romFile, mapFile]) => {
      return runRgbFix(romFile, mapFile);
    })
    .then(([romFile, mapFile]) => {
      buildDone(romFile, mapFile);
    })
    .catch((e) => {
      buildFailed();
    });
}

function runRgbAsm(target) {
  logFunction(`Running: rgbasm ${target} -o ${target}.o -Wall`);
  let objFile;
  return createRgbAsm({
    locateFile: locateFile(createRgbAsmModule),
    arguments: [target, "-o", "output.o", "-Wall"],
    preRun: (m) => {
      const FS = m.FS;
      for (const [key, value] of Object.entries(storage.getFiles())) {
        FS.writeFile(key, value);
      }
    },
    print: logFunction,
    printErr: logFunction,
    quit: () => {
      throw new Error("Compilation failed");
    },
  }).then((m) => {
    if (repeat) {
      throw new Error();
    }
    const FS = m.FS;
    objFile = FS.readFile("output.o");
    return objFile;
  });
}

function runRgbLink(obj_files) {
  const files = Object.keys(obj_files);
  const args = ["-o", "output.gb", "--map", "output.map"].concat(link_options);
  files.forEach((name) => {
    args.push(`${name}.o`);
  });
  logFunction(`Running: ${args.join(" ")}`);
  return createRgbLink({
    locateFile: locateFile(createRgbLinkModule),
    arguments: args,
    preRun: (m) => {
      const FS = m.FS;
      files.forEach((name) => {
        FS.writeFile(`${name}.o`, obj_files[name]);
      });
    },
    print: logFunction,
    printErr: logFunction,
  }).then((m) => {
    if (repeat) {
      throw new Error();
    }
    const FS = m.FS;
    const rom_file = FS.readFile("output.gb");
    const map_file = FS.readFile("output.map", { encoding: "utf8" });

    return [rom_file, map_file];
    // buildDone(rom_file, map_file);
  });
}

function runRgbFix(input_rom_file, map_file) {
  logFunction("Running: rgbfix -v output.gb -p 0xff");
  return createRgbFix({
    locateFile: locateFile(createRgbFixModule),
    arguments: ["-v", "output.gb", "-p", "0xff"],
    preRun: (m) => {
      const FS = m.FS;
      FS.writeFile("output.gb", input_rom_file);
    },
    print: logFunction,
    printErr: logFunction,
  }).then((m) => {
    const FS = m.FS;
    return [FS.readFile("output.gb"), map_file];
  });
}

function buildFailed() {
  logFunction("Build failed");
  if (repeat) {
    repeat = false;
    trigger();
  } else {
    busy = false;
    done_callback();
  }
}

function buildDone(rom_file, map_file) {
  if (repeat) {
    repeat = false;
    trigger();
  } else {
    busy = false;

    let start_address = 0x100;
    const addr_to_line = {};
    const sym_re = /^\s*\$([0-9a-f]+) = ([\w\.]+)/;
    const section_type_bank_re = /^\s*(\w+) bank #(\d+)/;
    const section_re = /^\s*SECTION: \$([0-9a-f]+)-\$([0-9a-f]+)/;
    const slack_re = /^\s*SLACK: \$([0-9a-f]+) bytes/;

    let section_type = "";
    let bank_nr = 0;
    for (const line of map_file.split("\n")) {
      let m;
      if ((m = sym_re.exec(line))) {
        let addr = parseInt(m[1], 16);
        let sym = m[2];

        if (sym.startsWith("__SEC_")) {
          sym = sym.substr(6);
          let file = sym.substr(sym.indexOf("_") + 1);
          file = file.substr(file.indexOf("_") + 1);
          const line_nr = parseInt(sym.split("_")[1], 16);
          addr = (addr & 0x3fff) | (bank_nr << 14);
          addr_to_line[addr] = [file, line_nr];
        } else if (
          sym === "emustart" ||
          sym === "emuStart" ||
          sym === "emu_start"
        ) {
          start_address = addr;
        } else if (addr < 0x8000) {
          addr = (addr & 0x3fff) | (bank_nr << 14);
          rom_symbols[addr] = sym;
        } else {
          ram_symbols[addr] = sym;
        }
      } else if ((m = section_re.exec(line))) {
        let start_addr = parseInt(m[1], 16);
        let end_addr = parseInt(m[2], 16) + 1;
        if (start_addr < 0x8000) {
          start_addr = (start_addr & 0x3fff) | (bank_nr << 14);
          end_addr = (end_addr & 0x3fff) | (bank_nr << 14);
          rom_symbols[start_addr] = null;
          rom_symbols[end_addr] = null;
        } else {
          ram_symbols[start_addr] = null;
          ram_symbols[end_addr] = null;
        }
      } else if ((m = section_type_bank_re.exec(line))) {
        section_type = m[1];
        bank_nr = parseInt(m[2], 0);
      } else if ((m = slack_re.exec(line))) {
        const space = parseInt(m[1], 16);
        let total = 0x4000;
        if (section_type.startsWith("WRAM")) total = 0x1000;
        else if (section_type.startsWith("HRAM")) total = 127;
        logFunction(
          `Space left: ${section_type}[${bank_nr}]: ${space}  (${(
            (space / total) *
            100
          ).toFixed(1)}%)`
        );
      }
    }
    logFunction("Build done");
    done_callback(rom_file, start_address, addr_to_line);
  }
}

export default {
  setLogCallback: (callback) => {
    log_callback = callback;
  },
  compile: (callback) => {
    done_callback = callback;
    if (busy) {
      repeat = true;
    } else {
      busy = true;
      trigger();
    }
  },
  getErrors: () => error_list,
  getRomSymbols: () => rom_symbols,
  getRamSymbols: () => ram_symbols,
  setLinkOptions: (options) => {
    link_options = options;
  },
};
