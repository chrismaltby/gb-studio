import fs from "fs-extra";
import os from "os";
import isElectron from "./isElectron";

const getTmp = async (create = true) => {
  let tmpPath = os.tmpdir();
  if (isElectron()) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const { settingsGet } = require("lib/helpers/appSettings");
    const electronSettingsTmp = await settingsGet("tmpDir");
    if (electronSettingsTmp) {
      tmpPath = electronSettingsTmp;
    }
  }
  if (
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

export default getTmp;
