import fs from "fs-extra";
import rimraf from "rimraf";
import { promisify } from "util";
import { defaultEngineMetaPath, defaultEngineRoot } from "consts";
import copy from "lib/helpers/fsCopy";

const rmdir = promisify(rimraf);

const ejectEngineToDir = async (ejectPath: string) => {
  const engineSrcPath = `${defaultEngineRoot}/src`;
  const engineIncludePath = `${defaultEngineRoot}/include`;
  const ejectSrcPath = `${ejectPath}/src`;
  const ejectIncludePath = `${ejectPath}/include`;
  const ejectMetaPath = `${ejectPath}/engine.json`;

  await rmdir(ejectPath);

  await fs.ensureDir(ejectPath);
  await fs.ensureDir(ejectSrcPath);
  await fs.ensureDir(ejectIncludePath);

  await copy(engineSrcPath, ejectSrcPath);
  await copy(engineIncludePath, ejectIncludePath);
  console.log("COPY", { defaultEngineMetaPath, ejectMetaPath });
  await copy(defaultEngineMetaPath, ejectMetaPath);
};

export default ejectEngineToDir;
