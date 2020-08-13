import fs from "fs-extra";
import rimraf from "rimraf";
import { promisify } from "util";
import { buildToolsRoot } from "../../consts";
import copy from "../helpers/fsCopy";
import getTmp from "../helpers/getTmp";

const rmdir = promisify(rimraf);

const EXPECTED_TOOLS_VERSION = "2.0.0";

const ensureBuildTools = async () => {
  const buildToolsPath = `${buildToolsRoot}/${process.platform}-${process.arch}`;

  const tmpPath = getTmp();
  const tmpBuildToolsPath = `${tmpPath}/_gbstools`;
  const tmpBuildToolsVersionPath = `${tmpPath}/_gbstools/tools_version`;

  // Symlink build tools so that path doesn't contain any spaces
  // GBDKDIR doesn't work if path has spaces :-(
  try {
    const toolsVersion = await fs.readFile(tmpBuildToolsVersionPath, "utf8");
    if(toolsVersion !== EXPECTED_TOOLS_VERSION) {
      throw new Error("Incorrect tools version found");
    }
  } catch (e) {
    await rmdir(tmpBuildToolsPath);
    await copy(buildToolsPath, tmpBuildToolsPath, {
      overwrite: false,
      mode: 0o755,
    });
  }

  return tmpBuildToolsPath;
};

export default ensureBuildTools;
