import childProcess from "child_process";
import { remote } from "electron";
import fs from "fs-extra";
import { buildToolsRoot } from "../../consts";
import copy from "../helpers/fsCopy";
import buildMakeBat from "./buildMakeBat";
import { hexDec } from "../helpers/8bit";
import getTmp from "../helpers/getTmp";

const HEADER_TITLE = 0x134;
const HEADER_CHECKSUM = 0x14d;
const GLOBAL_CHECKSUM = 0x14e;

const filterLogs = str => {
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

const convertHexTo15BitRGB = hex => {
  const r = Math.floor(hexDec(hex.substring(0, 2)) * (32 / 256));
  const g = Math.floor(hexDec(hex.substring(2, 4)) * (32 / 256));
  const b = Math.max(1, Math.floor(hexDec(hex.substring(4, 6)) * (32 / 256)));
  return `RGB(${r}, ${g}, ${b})`;
};

const patchROM = romData => {
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

const makeBuild = ({
  buildType = "rom",
  buildRoot = "/tmp",
  data = {},
  progress = () => {},
  warnings = () => {}
} = {}) => {
  return new Promise(async (resolve, reject) => {
    const env = Object.create(process.env);
    const { settings } = data;

    const buildToolsPath = `${buildToolsRoot}/${process.platform}-${
      process.arch
    }`;

    const tmpPath = getTmp();
    const tmpBuildToolsPath = `${tmpPath}/_gbs`;

    // Symlink build tools so that path doesn't contain any spaces
    // GBDKDIR doesn't work if path has spaces :-(
    try {
      await fs.unlink(tmpBuildToolsPath);
      await fs.ensureSymlink(buildToolsPath, tmpBuildToolsPath);
    } catch (e) {
      await copy(buildToolsPath, tmpBuildToolsPath, {
        overwrite: firstBuild
      });
    }
    
    firstBuild = false;

    env.PATH = [`${tmpBuildToolsPath}/gbdk/bin`, env.PATH].join(":");
    env.GBDKDIR = `${tmpBuildToolsPath}/gbdk/`;

    env.CART_TYPE = parseInt(settings.cartType || "1B", 16);
    env.TMP = getTmp();
    env.TEMP = getTmp();
    
    // Modify game.h to overide color palette
    let gameHeader = await fs.readFile(`${buildRoot}/include/game.h`, "utf8");
    if(settings.customColorsEnabled) {
      gameHeader = gameHeader
        .replace(/RGB\(28, 31, 26\)/g, convertHexTo15BitRGB(settings.customColorsWhite))
        .replace(/RGB\(17, 24, 14\)/g, convertHexTo15BitRGB(settings.customColorsLight))
        .replace(/RGB\(6, 13, 10\)/g, convertHexTo15BitRGB(settings.customColorsDark))
        .replace(/RGB\(1, 3, 4\)/g, convertHexTo15BitRGB(settings.customColorsBlack));
    } else {
      gameHeader = gameHeader.replace(/#define CUSTOM_COLORS/g, '');
    }
    await fs.writeFile(`${buildRoot}/include/game.h`, gameHeader, "utf8");

    // Remove GBC Rombyte Offset from Makefile (OSX/Linux) if custom colors not enabled
    if (process.platform !== "win32" && !settings.customColorsEnabled)
    {
      let makeFile = await fs.readFile(`${buildRoot}/Makefile`, "utf8");
      makeFile = makeFile.replace("-Wl-yp0x143=0x80", "");
      await fs.writeFile(`${buildRoot}/Makefile`, makeFile, "utf8");
    }

    const makeBat = await buildMakeBat(buildRoot, {
      CART_TYPE: env.CART_TYPE,
      customColorsEnabled: settings.customColorsEnabled
    });
    await fs.writeFile(`${buildRoot}/make.bat`, makeBat);

    const command = process.platform === "win32" ? "make.bat" : "make";
    const args = ["rom"];

    const options = {
      cwd: buildRoot,
      env,
      shell: true
    };

    const child = childProcess.spawn(command, args, options, {
      encoding: "utf8"
    });

    child.on("error", err => {
      warnings(err.toString());
    });

    child.stdout.on("data", childData => {
      const lines = childData.toString().split("\n");
      lines.forEach(line => {
        progress(filterLogs(line));
      });
    });

    child.stderr.on("data", childData => {
      const lines = childData.toString().split("\n");
      lines.forEach(line => {
        warnings(line);
      });
    });

    child.on("close", async code => {
      if (code === 0) {
        await setROMTitle(
          `${buildRoot}/build/rom/game.gb`,
          data.name.toUpperCase()
        );
        resolve();
      } else reject(code);
    });
  });
};

export default makeBuild;
