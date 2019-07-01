import { remote } from "electron";
import fs from "fs-extra";

export default () => {
  let tmpPath = remote.app.getPath("temp");
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
