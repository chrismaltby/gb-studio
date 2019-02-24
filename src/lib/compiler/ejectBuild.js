import fs from "fs-extra";
import rimraf from "rimraf";
import { promisify } from "util";

const rmdir = promisify(rimraf);

const noopEmitter = {
  emit: () => {}
};

const coreRoot = __dirname + "/../../data/src";

const ejectBuild = async ({
  projectType = "gb",
  outputRoot = "/tmp",
  eventEmitter = noopEmitter,
  compiledData
} = {}) => {
  console.log("EJECT to " + outputRoot);
  const corePath = `${coreRoot}/${projectType}`;
  await rmdir(outputRoot);
  await fs.ensureDir(outputRoot);
  await fs.copy(corePath, outputRoot);
  await fs.ensureDir(`${outputRoot}/src/data`);
  for (let filename in compiledData) {
    if (filename.endsWith(".h")) {
      await fs.writeFile(
        `${outputRoot}/include/${filename}`,
        compiledData[filename]
      );
    } else {
      await fs.writeFile(
        `${outputRoot}/src/data/${filename}`,
        compiledData[filename]
      );
    }
  }
};

export default ejectBuild;
