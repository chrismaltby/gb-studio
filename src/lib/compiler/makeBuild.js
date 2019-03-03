import childProcess from "child_process";
import is from "electron-is";
import path from "path";
import { remote } from "electron";
import fs from "fs-extra";

const makeBuild = ({
  buildType = "rom",
  buildRoot = "/tmp",
  progress = () => {},
  warnings = () => {}
} = {}) => {
  return new Promise(async (resolve, reject) => {
    let env = Object.create(process.env);

    const buildToolsPath = path.resolve(
      __dirname,
      `../../../buildTools/${process.platform}-${process.arch}`
    );

    const tmpPath = remote.app.getPath("temp");
    const tmpBuildToolsPath = `${tmpPath}_gbstudio_build_tools_`;

    // Symlink build tools so that path doesn't contain any spaces
    // GBDKDIR doesn't work if path has spaces :-(
    try {
      await fs.unlink(tmpBuildToolsPath);
    } catch (e) {}
    await fs.ensureSymlink(buildToolsPath, tmpBuildToolsPath);

    env.PATH = [
      `${tmpBuildToolsPath}/emsdk`,
      `${tmpBuildToolsPath}/emsdk/clang/e1.38.28_64bit`,
      `${tmpBuildToolsPath}/emsdk/node/8.9.1_64bit/bin`,
      `${tmpBuildToolsPath}/emsdk/emscripten/1.38.28`,
      `${tmpBuildToolsPath}/gbdk/bin`,
      `${tmpBuildToolsPath}/fakejava`,
      env.PATH
    ].join(":");

    env.GBDKDIR = `${tmpBuildToolsPath}/gbdk/`;
    env.EMSDK = `${tmpBuildToolsPath}/emsdk`;
    env.BINARYEN_ROOT = `${tmpBuildToolsPath}/emsdk/clang/e1.38.28_64bit/binaryen`;
    env.EMSCRIPTEN = `${tmpBuildToolsPath}/emsdk/emscripten/1.38.28`;
    env.LLVM_ROOT = `${tmpBuildToolsPath}/emsdk/clang/e1.38.28_64bit`;
    env.EMSCRIPTEN_NATIVE_OPTIMIZER = `${tmpBuildToolsPath}/emsdk/clang/e1.38.28_64bit/optimizer`;
    env.BINARYEN_ROOT = `${tmpBuildToolsPath}/emsdk/clang/e1.38.28_64bit/binaryen`;
    env.NODE_JS = `${tmpBuildToolsPath}/emsdk/node/8.9.1_64bit/bin/node`;
    env.EMSCRIPTEN_ROOT = `${tmpBuildToolsPath}/emsdk/emscripten/1.38.28`;

    const command =
      buildType === "web"
        ? `${tmpBuildToolsPath}/emsdk/emsdk activate latest && make`
        : "make";
    const args = [buildType];

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
        progress(line);
      });
    });

    child.stderr.on("data", function(data) {
      const lines = data.toString().split("\n");
      lines.forEach(line => {
        warnings(line);
      });
    });

    child.on("close", function(code) {
      if (code == 0) resolve();
      else reject(code);
    });
  });
};

export default makeBuild;
