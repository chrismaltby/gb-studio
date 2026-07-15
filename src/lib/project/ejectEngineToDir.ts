import fs from "fs-extra";
import { rimraf as rmdir } from "rimraf";
import { defaultEngineMetaPath, defaultEngineRoot } from "consts";

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

  await fs.copy(engineSrcPath, ejectSrcPath);
  await fs.copy(engineIncludePath, ejectIncludePath);
  await fs.copy(defaultEngineMetaPath, ejectMetaPath);
};

export default ejectEngineToDir;
