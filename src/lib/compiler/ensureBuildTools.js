import path from "path";
import { remote } from "electron";
import fs from "fs-extra";
import { buildToolsRoot } from "../../consts";

const ensureBuildTools = async () => {
  const buildToolsPath = `${buildToolsRoot}/${process.platform}-${
    process.arch
  }`;

  console.log("ENSURE", { buildToolsRoot, buildToolsPath });

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
