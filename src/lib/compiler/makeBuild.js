import childProcess from "child_process";
import is from "electron-is";
import path from "path";
import { remote } from "electron";
import fs from "fs-extra";
import { buildToolsRoot } from "../../consts";
import copy from "../helpers/fsCopy";
import buildMakeBat from "./buildMakeBat";

const filterLogs = str => {
  return str.replace(/.*:\\.*>/g, "").replace(/.*:\\.*music/g, "");
};

const setROMTitle = async (filename, title) => {
  const romData = await fs.readFile(filename);
  for (let i = 0; i < 15; i++) {
    const charCode = title.charCodeAt(i) < 256 ? title.charCodeAt(i) || 0 : 0;
    romData[308 + i] = charCode;
  }
  await fs.writeFile(filename, romData);
};

const makeBuild = ({
  buildType = "rom",
  buildRoot = "/tmp",
  data = {},
  progress = () => {},
  warnings = () => {}
} = {}) => {
  return new Promise(async (resolve, reject) => {
    let env = Object.create(process.env);

    const buildToolsPath = `${buildToolsRoot}/${process.platform}-${
      process.arch
    }`;

    console.log("BUILD TOOLS", buildToolsPath);

    const tmpPath = remote.app.getPath("temp");
    const tmpBuildToolsPath = `${tmpPath}/_gbs`;

    // Symlink build tools so that path doesn't contain any spaces
    // GBDKDIR doesn't work if path has spaces :-(
    try {
      await fs.unlink(tmpBuildToolsPath);
      await fs.ensureSymlink(buildToolsPath, tmpBuildToolsPath);
    } catch (e) {
      await copy(buildToolsPath, tmpBuildToolsPath, {
        overwrite: false
      });
    }

    env.PATH = [`${tmpBuildToolsPath}/gbdk/bin`, env.PATH].join(":");
    env.GBDKDIR = `${tmpBuildToolsPath}/gbdk/`;
    env.CART_TYPE = parseInt(data.settings.cartType || "1B", 16);

    const makeBat = await buildMakeBat(buildRoot, { CART_TYPE: env.CART_TYPE });
    await fs.writeFile(`${buildRoot}/make.bat`, makeBat);

    const command = process.platform === "win32" ? "make.bat" : "make";
    const args = ["rom"];

    const options = {
      cwd: buildRoot,
      env,
      shell: true
    };

    let child = childProcess.spawn(command, args, options, {
      encoding: "utf8"
    });

    child.on("error", function(err) {
      warnings(err.toString());
    });

    child.stdout.on("data", function(data) {
      const lines = data.toString().split("\n");
      lines.forEach(line => {
        progress(filterLogs(line));
      });
    });

    child.stderr.on("data", function(data) {
      const lines = data.toString().split("\n");
      lines.forEach(line => {
        warnings(line);
      });
    });

    child.on("close", async function(code) {
      if (code == 0) {
        await setROMTitle(`${buildRoot}/build/rom/game.gb`, data.name);
        resolve();
      } else reject(code);
    });
  });
};

export default makeBuild;
