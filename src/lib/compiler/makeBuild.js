import childProcess from "child_process";
import is from "electron-is";
import path from "path";

const makeBuild = ({
  buildType = "rom",
  buildRoot = "/tmp",
  progress = () => {},
  warnings = () => {}
} = {}) => {
  return new Promise((resolve, reject) => {
    const command = "make";
    const args = [buildType];

    let env = Object.create(process.env);

    const emscriptenPath = path.resolve(
      __dirname,
      "../../../buildTools/mac/emscripten"
    );
    const gbdkPath = path.resolve(
      __dirname,
      "../../../buildTools/mac/gbdk/bin"
    );

    env.PATH = emscriptenPath + ":" + gbdkPath + ":" + env.PATH;

    const options = {
      cwd: buildRoot,
      env
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
