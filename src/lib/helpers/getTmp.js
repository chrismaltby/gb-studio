import { remote } from "electron";

export default () => {
  const tmpPath = remote.app.getPath("temp");
  if (tmpPath.indexOf(" ") === -1) {
    return tmpPath;
  }
  if (process.platform === "win32") {
    return "C:\tmp";
  }
  return "/tmp";
};
