import fs from "fs-extra";
import rimraf from "rimraf";
import { promisify } from "util";
import Path from "path";
import { engineRoot } from "../../consts";
import copy from "../helpers/fsCopy";

const rmdir = promisify(rimraf);

const ejectEngineToDir = async (ejectPath, { projectType = "gb" } = {}) => {
  const enginePath = `${engineRoot}/${projectType}`;
  const engineSrcPath = `${enginePath}/src`;
  const engineIncludePath = `${enginePath}/include`;
  const engineVersionPath = `${enginePath}/engine_version`;
  const engineMetaPath = `${enginePath}/engine.json`;
  const ejectSrcPath = `${ejectPath}/src`;
  const ejectIncludePath = `${ejectPath}/include`;
  const ejectVersionPath = `${ejectPath}/engine_version`;
  const ejectMetaPath = `${ejectPath}/engine.json`;

  await rmdir(ejectPath);

  await fs.ensureDir(ejectPath);
  await fs.ensureDir(ejectSrcPath);
  await fs.ensureDir(ejectIncludePath);

  await copy(engineSrcPath, ejectSrcPath);
  await copy(engineIncludePath, ejectIncludePath);
  await copy(engineVersionPath, ejectVersionPath);
  await copy(engineMetaPath, ejectMetaPath);
};

export default ejectEngineToDir;
