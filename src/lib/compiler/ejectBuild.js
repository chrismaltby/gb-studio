import fs from "fs-extra";
import rimraf from "rimraf";
import { promisify } from "util";
import Path from "path";
import { engineRoot } from "../../consts";
import copy from "../helpers/fsCopy";

const rmdir = promisify(rimraf);

const ejectBuild = async ({
  projectType = "gb",
  outputRoot = "/tmp",
  projectRoot = "/tmp",
  compiledData,
  progress = () => {},
  warnings = () => {},
} = {}) => {
  const corePath = `${engineRoot}/${projectType}`;
  const localCorePath = `${projectRoot}/assets/engine`;

  progress(`Unlink ${Path.basename(outputRoot)}`);
  await rmdir(outputRoot);
  await fs.ensureDir(outputRoot);
  progress("Copy default engine");

  await copy(corePath, outputRoot);

  try {
    progress("Looking for local engine in assets/engine");
    await copy(localCorePath, outputRoot);
    progress("Copy local engine");
  } catch (e) {
    progress("Local engine not found, using default engine");
  }

  await fs.ensureDir(`${outputRoot}/src/data`);
  await fs.ensureDir(`${outputRoot}/node_modules`);
  await fs.ensureDir(`${outputRoot}/obj`);
  await fs.ensureDir(`${outputRoot}/obj/music`);
  await fs.ensureDir(`${outputRoot}/obj/data`);
  await fs.ensureDir(`${outputRoot}/build/rom`);

  for (const filename in compiledData.files) {
    if (filename.endsWith(".h")) {
      progress(`Generate header: ${filename}`);
      await fs.writeFile(
        `${outputRoot}/include/${filename}`,
        compiledData.files[filename]
      );
    } else if (filename.endsWith(".o")) {
      progress(`Generate object file: ${filename}`);
      await fs.writeFile(
        `${outputRoot}/obj/${filename}`,
        compiledData.files[filename]
      );      
    } else {
      progress(`Generate data file: ${filename}`);
      await fs.writeFile(
        `${outputRoot}/src/data/${filename}`,
        compiledData.files[filename]
      );
    }
  }
};

export default ejectBuild;
