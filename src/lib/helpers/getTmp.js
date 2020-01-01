import fs from "fs-extra";
import os from "os";

export default () => {
  let tmpPath = os.tmpdir();
  if (
    tmpPath.indexOf(" ") === -1 &&
    tmpPath.indexOf(".itch") === -1 &&
    (process.platform !== "win32" || tmpPath.length < 35)
  ) {
    // Ok
  } else if (process.platform === "win32") {
    tmpPath = "C:\\tmp";
  } else tmpPath = "/tmp";
  fs.ensureDirSync(tmpPath);
  return tmpPath;
};
