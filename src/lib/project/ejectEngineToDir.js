import fs from "fs-extra";
import rimraf from "rimraf";
import { promisify } from "util";
import { engineRoot } from "../../consts";
import copy from "../helpers/fsCopy";

const rmdir = promisify(rimraf);

const ejectEngineToDir = async (ejectPath, { projectType = "gb" } = {}) => {
  const enginePath = `${engineRoot}/${projectType}`;
  const engineSrcPath = `${enginePath}/src`;
  const engineIncludePath = `${enginePath}/include`;
  const engineMetaPath = `${enginePath}/engine.json`;
  const ejectSrcPath = `${ejectPath}/src`;
  const ejectIncludePath = `${ejectPath}/include`;
  const ejectMetaPath = `${ejectPath}/engine.json`;

  await rmdir(ejectPath);

  await fs.ensureDir(ejectPath);
  await fs.ensureDir(ejectSrcPath);
  await fs.ensureDir(ejectIncludePath);

  await copy(engineSrcPath, ejectSrcPath);
  await copy(engineIncludePath, ejectIncludePath);
  await copy(engineMetaPath, ejectMetaPath);
};

export default ejectEngineToDir;
