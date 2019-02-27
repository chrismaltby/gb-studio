import fs from "fs-extra";
import rimraf from "rimraf";
import { promisify } from "util";

const rmdir = promisify(rimraf);

const coreRoot = __dirname + "/../../data/src";

const ejectBuild = async ({
  projectType = "gb",
  outputRoot = "/tmp",
  compiledData,
  progress = () => {},
  warnings = () => {}
} = {}) => {
  // console.log("EJECT to " + outputRoot);
  const corePath = `${coreRoot}/${projectType}`;
  progress("Unlink " + outputRoot);
  await rmdir(outputRoot);
  await fs.ensureDir(outputRoot);
  progress("Copy core");
  await fs.copy(corePath, outputRoot);
  await fs.ensureDir(`${outputRoot}/src/data`);
  await fs.ensureDir(`${outputRoot}/node_modules`);
  await fs.ensureSymlink(
    `${__dirname}/../../../node_modules/gbdkjs`,
    `${outputRoot}/node_modules/gbdkjs`
  );
  for (let filename in compiledData) {
    if (filename.endsWith(".h")) {
      progress("Copy header " + filename);

      await fs.writeFile(
        `${outputRoot}/include/${filename}`,
        compiledData[filename]
      );
    } else {
      progress("Copy code " + filename);
      await fs.writeFile(
        `${outputRoot}/src/data/${filename}`,
        compiledData[filename]
      );
    }
  }
};

export default ejectBuild;
