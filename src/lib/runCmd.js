import process from "child_process";
import is from "electron-is";

function showOS() {
  if (is.windows()) console.log("Windows Detected.");
  if (is.macOS()) console.log("Apple OS Detected.");
  if (is.linux()) console.log("Linux Detected.");
}

function runCommand(command, args, options, callback) {
  showOS();
  //   var cmd = is.windows() ? "test.bat" : "./test.sh";
  // let cmd = "ls -l ~/Desktop";
  // console.log("cmd:", cmd);

  var child = process.spawn(command, args, options, {
    encoding: "utf8"
  });

  child.on("error", function(err) {
    console.log("ERROR", err);
    callback({ type: "err", text: err.toString() });
  });

  child.stdout.on("data", function(data) {
    console.log(`stdout: ${data}`);
    const lines = data.toString().split("\n");
    lines.forEach(line => {
      callback({ type: "out", text: line });
    });
  });

  child.stderr.on("data", function(data) {
    console.log(`stderr: ${data}`);
    const lines = data.toString().split("\n");
    lines.forEach(line => {
      console.log("LINE", line);
      callback({ type: "err", text: line });
    });
  });

  child.on("close", function(code) {
    if (code == 0) callback({ type: "complete" });
    else
      callback({
        type: "complete",
        text: "child process exited with code " + code
      });
  });
}

export default runCommand;
