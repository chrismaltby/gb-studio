import fs from "fs-extra";
import rimraf from "rimraf";
import { promisify } from "util";
import Path from "path";
import { engineRoot } from "consts";
import copy from "lib/helpers/fsCopy";
import ejectEngineChangelog from "lib/project/ejectEngineChangelog";
import {
  buildMakeDotBuildFile,
  makefileInjectToolsPath,
} from "./buildMakeScript";
import ensureBuildTools from "./ensureBuildTools";
import glob from "glob";
import l10n from "shared/lib/lang/l10n";
import type { EngineFieldSchema } from "store/features/engine/engineState";
import type { ProjectData } from "store/features/project/projectActions";

const rmdir = promisify(rimraf);

type EjectOptions = {
  projectType: "gb";
  engineFields: EngineFieldSchema[];
  projectData: ProjectData;
  outputRoot: string;
  projectRoot: string;
  tmpPath: string;
  compiledData: {
    files: Record<string, string>;
  };
  progress: (msg: string) => void;
  warnings: (msg: string) => void;
};

const readEngineVersion = async (path: string) => {
  return (await fs.readJSON(path, { encoding: "utf8" })).version;
};

const readEngineVersionLegacy = async (path: string) => {
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
}: EjectOptions) => {
  const corePath = `${engineRoot}/${projectType}`;
  const localCorePath = `${projectRoot}/assets/engine`;
  const pluginsPath = `${projectRoot}/plugins`;
  const expectedEngineMetaPath = `${corePath}/engine.json`;
  const buildToolsPath = await ensureBuildTools(tmpPath);
  const { settings } = projectData;
  const colorEnabled = settings.colorMode !== "mono";

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
        ejectedEngineVersion = "";
      }
    }
    if (
      ejectedEngineVersion &&
      ejectedEngineVersion !== expectedEngineVersion
    ) {
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

  progress("Looking for engine plugins in plugins/*/engine");
  const enginePlugins = glob.sync(`${pluginsPath}/*/engine`);
  for (const enginePluginPath of enginePlugins) {
    progress(
      `Using engine plugin: ${Path.relative(pluginsPath, enginePluginPath)}`
    );
    const pluginName = Path.basename(Path.dirname(enginePluginPath));
    try {
      const pluginEngineMetaPath = `${enginePluginPath}/engine.json`;
      const pluginEngineVersion = await readEngineVersion(pluginEngineMetaPath);
      if (!pluginEngineVersion) {
        throw new Error("Missing plugin engine version");
      }
      if (pluginEngineVersion !== expectedEngineVersion) {
        warnings(
          `${l10n("WARNING_ENGINE_PLUGIN_OUT_OF_DATE", {
            pluginName,
            pluginEngineVersion,
            expectedEngineVersion,
          })}`
        );
      }
    } catch (e) {
      warnings(
        `${l10n("WARNING_ENGINE_PLUGIN_MISSING_MANIFEST", {
          pluginName,
          expectedEngineVersion,
        })}`
      );
    }
    await copy(enginePluginPath, outputRoot);
  }

  // Modify engineField defines for any engine fields that define a "file" field
  await Promise.all(
    engineFields
      .filter(
        (engineField) => engineField.cType === "define" && engineField.file
      )
      .reduce(
        (memo, engineField) => {
          // Group by file first
          const group = memo.find((g) => g.file === engineField.file);

          if (!group) {
            memo.push({
              file: engineField.file ?? "",
              fields: [engineField],
            });
          } else {
            group.fields.push(engineField);
          }

          return memo;
        },
        [] as {
          file: string;
          fields: EngineFieldSchema[];
        }[]
      )
      .map(async (engineFile): Promise<void> => {
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
    color: colorEnabled,
    sgb: settings.sgbEnabled,
    batteryless: settings.batterylessEnabled,
    musicDriver: settings.musicDriver,
  });
  await fs.writeFile(`${outputRoot}/Makefile.build`, makeDotBuildFile);
};

export default ejectBuild;
