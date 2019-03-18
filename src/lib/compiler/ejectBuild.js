import fs from "fs-extra";
import rimraf from "rimraf";
import { promisify } from "util";
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
  // console.log("EJECT to " + outputRoot);
  progress("HERE CORE ROOT= " + engineRoot);
  const corePath = `${engineRoot}/${projectType}`;
  progress("Unlink " + outputRoot);
  await rmdir(outputRoot);
  await fs.ensureDir(outputRoot);
  progress("Copy core");

  console.log("COPYDIR", { corePath, outputRoot });
  await copy(corePath, outputRoot);

  await fs.ensureDir(`${outputRoot}/src/data`);
  await fs.ensureDir(`${outputRoot}/node_modules`);
  await fs.ensureDir(`${outputRoot}/obj`);
  await fs.ensureDir(`${outputRoot}/obj/music`);
  await fs.ensureDir(`${outputRoot}/obj/data`);

  for (let filename in compiledData.files) {
    if (filename.endsWith(".h")) {
      progress("Copy header " + filename);

      await fs.writeFile(
        `${outputRoot}/include/${filename}`,
        compiledData.files[filename]
      );
    } else {
      progress("Copy code " + filename);
      await fs.writeFile(
        `${outputRoot}/src/data/${filename}`,
        compiledData.files[filename]
      );
    }
  }
};

export default ejectBuild;
