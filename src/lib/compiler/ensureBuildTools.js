import fs from "fs-extra";
import { buildToolsRoot } from "../../consts";
import copy from "../helpers/fsCopy";
import getTmp from "../helpers/getTmp";

const ensureBuildTools = async () => {
  const buildToolsPath = `${buildToolsRoot}/${process.platform}-${
    process.arch
  }`;

  const tmpPath = getTmp();
  const tmpBuildToolsPath = `${tmpPath}/_gbs`;

  // Symlink build tools so that path doesn't contain any spaces
  // GBDKDIR doesn't work if path has spaces :-(
  try {
    await fs.fstat(tmpBuildToolsPath);
  } catch (e) {
    await copy(buildToolsPath, tmpBuildToolsPath, {
      overwrite: false,
      mode: 0o755
    });
  }

  return tmpBuildToolsPath;
};

export default ensureBuildTools;
