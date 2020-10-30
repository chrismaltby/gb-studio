import fs from "fs-extra";
import rimraf from "rimraf";
import { promisify } from "util";
import Path from "path";
import { engineRoot } from "../../consts";
import copy from "../helpers/fsCopy";
import ejectEngineChangelog from "../project/ejectEngineChangelog";
import l10n from "../helpers/l10n";

const rmdir = promisify(rimraf);

const readEngineVersion = async (path) => {
  return (await fs.readJSON(path, "utf8")).version;
}

const readEngineVersionLegacy = async (path) => {
  return (await fs.readFile(path, "utf8"))
    .replace(/#.*/g, "")
    .trim();
}

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
  const expectedEngineMetaPath = `${corePath}/engine.json`;

  progress(`Unlink ${Path.basename(outputRoot)}`);
  await rmdir(outputRoot);
  await fs.ensureDir(outputRoot);
  progress("Copy default engine");

  await copy(corePath, outputRoot);
  
  const expectedEngineVersion = await readEngineVersion(expectedEngineMetaPath);

  try {
    progress("Looking for local engine in assets/engine");
    await copy(localCorePath, outputRoot);
    progress("Copy local engine");

    const ejectedEngineMetaPath = `${localCorePath}/engine.json`;
    let ejectedEngineVersion;
    try {
      ejectedEngineVersion = await readEngineVersion(ejectedEngineMetaPath);
    } catch (e) {
      try {
        const ejectedEngineVersionLegacyPath = `${localCorePath}/engine_version`;
        ejectedEngineVersion = await readEngineVersionLegacy(ejectedEngineVersionLegacyPath);
      } catch (e2) {
        ejectedEngineVersion = "2.0.0-e1";
      }
    }
    if (ejectedEngineVersion !== expectedEngineVersion) {
      warnings(
        `${l10n("WARNING_ENGINE_OUT_OF_DATE", {
          ejectedEngineVersion,
          expectedEngineVersion,
        })}\n\n${ejectEngineChangelog(ejectedEngineVersion)}`
      );
    }
  } catch (e) {
    progress("Local engine not found, using default engine");
  }

  await fs.ensureDir(`${outputRoot}/src/data`);
  await fs.ensureDir(`${outputRoot}/obj`);
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
