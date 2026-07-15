import fs from "fs-extra";
import { rimraf as rmdir } from "rimraf";
import Path from "path";
import { defaultEngineMetaPath, defaultEngineRoot } from "consts";

const engineItems = [
  "src",
  "include",
  "lib",
  "Makefile",
  "Makefile.common",
] as const;

const ejectEngineToDir = async (ejectPath: string): Promise<void> => {
  await rmdir(ejectPath);
  await fs.ensureDir(ejectPath);

  for (const item of engineItems) {
    await fs.copy(
      Path.join(defaultEngineRoot, item),
      Path.join(ejectPath, item),
    );
  }

  await fs.copy(defaultEngineMetaPath, Path.join(ejectPath, "engine.json"));
};

export default ejectEngineToDir;
