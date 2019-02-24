import fs from "fs-extra";
import childProcess from "child_process";
import is from "electron-is";

const noopEmitter = {
  emit: () => {}
};

const makeBuild = ({
  buildType = "rom",
  buildRoot = "/tmp",
  progress = () => {}
} = {}) => {
  console.log("222", buildType);
  return new Promise((resolve, reject) => {
    const command = "make";
    console.log("!11", buildType);
    console.log("Aaa", buildType);
    const args = [buildType];
    console.log("BB", process.env);
    let env = Object.create(process.env);
    env.PATH = "/opt/emsdk/emscripten/1.38.6/:" + env.PATH;
    const options = {
      cwd: buildRoot,
      env
    };

    let child = childProcess.spawn(command, args, options, {
      encoding: "utf8"
    });

    child.on("error", function(err) {
      console.log("ERROR", err);
      progress({ type: "err", text: err.toString() });
    });

    child.stdout.on("data", function(data) {
      console.log(`stdout: ${data}`);
      const lines = data.toString().split("\n");
      lines.forEach(line => {
        progress({ type: "out", text: line });
      });
    });

    child.stderr.on("data", function(data) {
      console.log(`stderr: ${data}`);
      const lines = data.toString().split("\n");
      lines.forEach(line => {
        console.log("LINE", line);
        progress({ type: "err", text: line });
      });
    });

    child.on("close", function(code) {
      if (code == 0) resolve();
      else reject(code);
    });
  });
};

export default makeBuild;
