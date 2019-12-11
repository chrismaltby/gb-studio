import { remote, app } from "electron";
import fs from "fs-extra";

export default () => {
  const electronApp = remote && remote.app ? remote.app : app;
  let tmpPath = electronApp.getPath("temp");
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
