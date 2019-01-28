import process from "child_process";
import is from "electron-is";

function showOS() {
  if (is.windows()) console.log("Windows Detected.");
  if (is.macOS()) console.log("Apple OS Detected.");
  if (is.linux()) console.log("Linux Detected.");
}

function backgroundProcess(command, callback) {
  showOS();
  //   var cmd = is.windows() ? "test.bat" : "./test.sh";
  let cmd = "ls -l ~/Desktop";
  console.log("cmd:", cmd);

  var child = process.spawn(cmd);

  child.on("error", function(err) {
    callback("stderr: <" + err + ">");
  });

  child.stdout.on("data", function(data) {
    callback(data);
  });

  child.stderr.on("data", function(data) {
    callback("stderr: <" + data + ">");
  });

  child.on("close", function(code) {
    if (code == 0) callback("child process complete.");
    else callback("child process exited with code " + code);
  });
}

export default backgroundProcess;
