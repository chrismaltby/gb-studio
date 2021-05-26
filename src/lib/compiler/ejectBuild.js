import fs from "fs-extra";
import rimraf from "rimraf";
import { promisify } from "util";
import Path from "path";
import { engineRoot } from "../../consts";
import copy from "../helpers/fsCopy";
import ejectEngineChangelog from "../project/ejectEngineChangelog";
import l10n from "../helpers/l10n";
import {
  buildMakeDotBuildFile,
  makefileInjectToolsPath,
} from "./buildMakeScript";
import ensureBuildTools from "./ensureBuildTools";

const rmdir = promisify(rimraf);

const readEngineVersion = async (path) => {
  return (await fs.readJSON(path, "utf8")).version;
};

const readEngineVersionLegacy = async (path) => {
  return (await fs.readFile(path, "utf8")).replace(/#.*/g, "").trim();
};

const ejectBuild = async ({
  projectType = "gb",
  engineFields = [],
  projectData,
  outputRoot = "/tmp",
  projectRoot = "/tmp",
  tmpPath = "/tmp",
  compiledData,
  progress = (_msg) => {},
  warnings = (_msg) => {},
} = {}) => {
  const corePath = `${engineRoot}/${projectType}`;
  const localCorePath = `${projectRoot}/assets/engine`;
  const expectedEngineMetaPath = `${corePath}/engine.json`;
  const buildToolsPath = await ensureBuildTools(tmpPath);
  const { settings } = projectData;

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
        ejectedEngineVersion = await readEngineVersionLegacy(
          ejectedEngineVersionLegacyPath
        );
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

  // Modify engineField defines
  await Promise.all(
    engineFields
      .filter(
        (engineField) => engineField.cType === "define" && engineField.file
      )
      .reduce((memo, engineField) => {
        // Group by file first
        const group = memo.find((g) => g.file === engineField.file);

        if (!group) {
          memo.push({
            file: engineField.file,
            fields: [engineField],
          });
        } else {
          group.fields.push(engineField);
        }

        return memo;
      }, [])
      .map(async (engineFile) => {
        const filename = `${outputRoot}/${engineFile.file}`;
        let source = await fs.readFile(filename, "utf8");

        engineFile.fields.forEach((engineField) => {
          const engineValue = projectData.engineFieldValues.find(
            (v) => v.id === engineField.key
          );
          const value =
            engineValue && engineValue.value !== undefined
              ? engineValue.value
              : engineField.defaultValue;

          source = source.replace(
            new RegExp(`#define[ \t]*${engineField.key}[^\n]*`),
            `#define ${engineField.key} ${value}`
          );
        });

        await fs.writeFile(filename, source);
      })
  );

  await fs.ensureDir(`${outputRoot}/include/data`);
  await fs.ensureDir(`${outputRoot}/src/data`);
  await fs.ensureDir(`${outputRoot}/src/data/music`);
  await fs.ensureDir(`${outputRoot}/obj`);
  await fs.ensureDir(`${outputRoot}/build/rom`);

  for (const filename in compiledData.files) {
    if (filename.endsWith(".h") || filename.endsWith(".i")) {
      await fs.writeFile(
        `${outputRoot}/include/data/${filename}`,
        compiledData.files[filename]
      );
    } else if (filename.endsWith(".o")) {
      await fs.writeFile(
        `${outputRoot}/obj/${filename}`,
        compiledData.files[filename]
      );
    } else {
      await fs.writeFile(
        `${outputRoot}/src/data/${filename}`,
        compiledData.files[filename]
      );
    }
  }

  // Generate Makefile
  await makefileInjectToolsPath(`${outputRoot}/Makefile`, buildToolsPath);
  const makeDotBuildFile = buildMakeDotBuildFile({
    cartType: settings.cartType,
    color: settings.customColorsEnabled,
    sgb: settings.sgbEnabled,
    batteryless: settings.batterylessEnabled,
    musicDriver: settings.musicDriver,
  });
  await fs.writeFile(`${outputRoot}/Makefile.build`, makeDotBuildFile);
};

export default ejectBuild;
