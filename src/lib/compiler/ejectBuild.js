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
  compiledData,
  progress = () => {},
  warnings = () => {}
} = {}) => {
  const corePath = `${engineRoot}/${projectType}`;
  progress(`Unlink ${Path.basename(outputRoot)}`);
  await rmdir(outputRoot);
  await fs.ensureDir(outputRoot);
  progress("Copy core");

  await copy(corePath, outputRoot);
  await fs.ensureDir(`${outputRoot}/src/data`);
  await fs.ensureDir(`${outputRoot}/node_modules`);
  await fs.ensureDir(`${outputRoot}/obj`);
  await fs.ensureDir(`${outputRoot}/obj/music`);
  await fs.ensureDir(`${outputRoot}/obj/data`);
  await fs.ensureDir(`${outputRoot}/build/rom`);

  for (const filename in compiledData.files) {
    if (filename.endsWith(".h")) {
      progress(`Copy header ${filename}`);
      await fs.writeFile(
        `${outputRoot}/include/${filename}`,
        compiledData.files[filename]
      );
    } else {
      progress(`Copy code ${filename}`);
      await fs.writeFile(
        `${outputRoot}/src/data/${filename}`,
        compiledData.files[filename]
      );
    }
  }
};

export default ejectBuild;
