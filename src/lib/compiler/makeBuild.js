import childProcess from "child_process";
import fs from "fs-extra";
import { buildToolsRoot } from "../../consts";
import copy from "../helpers/fsCopy";
import buildMakeScript from "./buildMakeScript";
import { hexDec } from "../helpers/8bit";
import { isMBC1 } from "./helpers";
import { cacheObjData, fetchCachedObjData } from "./objCache";

const HEADER_TITLE = 0x134;
const HEADER_CHECKSUM = 0x14d;
const GLOBAL_CHECKSUM = 0x14e;

const filterLogs = (str) => {
  return str.replace(/.*:\\.*>/g, "").replace(/.*:\\.*music/g, "");
};

const setROMTitle = async (filename, title) => {
  const romData = await fs.readFile(filename);
  for (let i = 0; i < 15; i++) {
    const charCode = title.charCodeAt(i) < 256 ? title.charCodeAt(i) || 0 : 0;
    romData[HEADER_TITLE + i] = charCode;
  }
  await fs.writeFile(filename, await patchROM(romData));
};

const convertHexTo15BitRGB = (hex) => {
  const r = Math.floor(hexDec(hex.substring(0, 2)) * (32 / 256));
  const g = Math.floor(hexDec(hex.substring(2, 4)) * (32 / 256));
  const b = Math.max(1, Math.floor(hexDec(hex.substring(4, 6)) * (32 / 256)));
  return `RGB(${r}, ${g}, ${b})`;
};

const patchROM = (romData) => {
  let checksum = 0;
  let headerChecksum = 0;
  const view = new DataView(romData.buffer);

  // Recalculate header checksum
  for (let i = HEADER_TITLE; i < HEADER_CHECKSUM; i++) {
    headerChecksum = headerChecksum - view.getUint8(i) - 1;
  }

  view.setUint8(HEADER_CHECKSUM, headerChecksum);

  // Recalculate cart checksum
  for (let i = 0; i < romData.length; i++) {
    if (i !== GLOBAL_CHECKSUM && i !== GLOBAL_CHECKSUM + 1) {
      checksum += view.getUint8(i);
    }
  }

  view.setUint16(GLOBAL_CHECKSUM, checksum, false);

  return romData;
};

let firstBuild = true;

const makeBuild = async ({
  buildRoot = "/tmp",
  tmpPath = "/tmp",
  data = {},
  cartSize = 64,
  profile = false,
  progress = (_msg) => {},
  warnings = (_msg) => {},
} = {}) => {
    
  const env = Object.create(process.env);
  const { settings } = data;

  const buildToolsPath = `${buildToolsRoot}/${process.platform}-${process.arch}`;

  const tmpBuildToolsPath = `${tmpPath}/_gbstools`;

  // Symlink build tools so that path doesn't contain any spaces
  // GBDKDIR doesn't work if path has spaces :-(
  try {
    await fs.unlink(tmpBuildToolsPath);
    await fs.ensureSymlink(buildToolsPath, tmpBuildToolsPath);
  } catch (e) {
    await copy(buildToolsPath, tmpBuildToolsPath, {
      overwrite: firstBuild,
    });
  }

  firstBuild = false;

  env.PATH = [`${tmpBuildToolsPath}/gbdk/bin`, env.PATH].join(":");
  env.GBDKDIR = `${tmpBuildToolsPath}/gbdk/`;

  env.CART_TYPE = parseInt(settings.cartType || "1B", 16);
  env.CART_SIZE = cartSize;
  env.TMP = tmpPath;
  env.TEMP = tmpPath;
  if (settings.customColorsEnabled) {
    env.COLOR = true;
  }
  if (profile) {
    env.PROFILE = true;
  }

  // Modify BankManager.h to set MBC1 memory controller
  if (isMBC1(settings.cartType)) {
    let bankHeader = await fs.readFile(`${buildRoot}/include/BankManager.h`, "utf8");
    bankHeader = bankHeader.replace(/_MBC5/g, "_MBC1");
    await fs.writeFile(`${buildRoot}/include/BankManager.h`, bankHeader, "utf8");
  }

  // Remove GBC Rombyte Offset from Makefile (OSX/Linux) if custom colors and fast CPU are not enabled
  if (
    process.platform !== "win32" &&
    !settings.customColorsEnabled &&
    !settings.gbcFastCPUEnabled
  ) {
    let makeFile = await fs.readFile(`${buildRoot}/Makefile`, "utf8");
    makeFile = makeFile.replace("-Wm-yC", "");
    await fs.writeFile(`${buildRoot}/Makefile`, makeFile, "utf8");
  }

  await fetchCachedObjData(buildRoot, tmpPath, env);

  const makeScriptFile = process.platform === "win32" ? "make.bat" : "make.sh"
  
  const makeScript = await buildMakeScript(buildRoot, {
    CART_TYPE: env.CART_TYPE,
    CART_SIZE: env.CART_SIZE,
    customColorsEnabled: settings.customColorsEnabled,
    gbcFastCPUEnabled: settings.gbcFastCPUEnabled,
    profile,
    platform: process.platform
  });
  await fs.writeFile(`${buildRoot}/${makeScriptFile}`, makeScript);

  const command = process.platform === "win32" ? makeScriptFile : `/bin/sh ${makeScriptFile}`;
  const args = ["rom"];

  const options = {
    cwd: buildRoot,
    env,
    shell: true,
  };

  return new Promise((resolve, reject) => {
    const child = childProcess.spawn(command, args, options, {
      encoding: "utf8",
    });

    child.on("error", (err) => {
      warnings(err.toString());
    });

    child.stdout.on("data", (childData) => {
      const lines = childData.toString().split("\n");
      lines.forEach((line) => {
        progress(filterLogs(line));
      });
    });

    child.stderr.on("data", (childData) => {
      const lines = childData.toString().split("\n");
      lines.forEach((line) => {
        warnings(line);
      });
    });

    child.on("close", async (code) => {
      if (code === 0) {
        await setROMTitle(
          `${buildRoot}/build/rom/game.gb`,
          data.name.toUpperCase()
        );
        await cacheObjData(buildRoot, tmpPath, env);
        resolve();
      } else reject(code);
    });
  });
};

export default makeBuild;
