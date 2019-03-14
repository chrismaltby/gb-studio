import path from "path";
import { remote } from "electron";
import fs from "fs-extra";

const ensureBuildTools = async () => {
  const buildToolsPath = path.resolve(
    __dirname,
    `../../../buildTools/${process.platform}-${process.arch}`
  );

  const tmpPath = remote.app.getPath("temp");
  const tmpBuildToolsPath = `${tmpPath}/_gbs`;

  // Symlink build tools so that path doesn't contain any spaces
  // GBDKDIR doesn't work if path has spaces :-(
  try {
    await fs.unlink(tmpBuildToolsPath);
    await fs.ensureSymlink(buildToolsPath, tmpBuildToolsPath);
  } catch (e) {
    await fs.copy(buildToolsPath, tmpBuildToolsPath, {
      overwrite: false
    });
  }

  return tmpBuildToolsPath;
};

export default ensureBuildTools;
