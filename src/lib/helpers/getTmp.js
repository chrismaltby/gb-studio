import fs from "fs-extra";
import os from "os";
import settings from "electron-settings";

export default (create = true) => {
  let tmpPath = os.tmpdir();
  if (settings.get("tmpDir")) {
    tmpPath = settings.get("tmpDir");
  } else if (
    tmpPath.indexOf(" ") === -1 &&
    tmpPath.indexOf(".itch") === -1 &&
    (process.platform !== "win32" || tmpPath.length < 35)
  ) {
    // Ok
  } else if (process.platform === "win32") {
    tmpPath = "C:\\tmp";
  } else tmpPath = "/tmp";
  if (create) {
    fs.ensureDirSync(tmpPath);
  }
  return tmpPath;
};
