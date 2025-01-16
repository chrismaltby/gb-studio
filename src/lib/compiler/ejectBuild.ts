import fs from "fs-extra";
import rimraf from "rimraf";
import { promisify } from "util";
import Path from "path";
import { defaultEngineMetaPath, defaultEngineRoot } from "consts";
import copy from "lib/helpers/fsCopy";
import ejectEngineChangelog, {
  isKnownEngineVersion,
} from "lib/project/ejectEngineChangelog";
import {
  buildMakeDotBuildFile,
  makefileInjectToolsPath,
} from "./buildMakeScript";
import ensureBuildTools from "./ensureBuildTools";
import glob from "glob";
import l10n from "shared/lib/lang/l10n";
import type {
  EngineFieldSchema,
  SceneTypeSchema,
} from "store/features/engine/engineState";
import { readEngineVersion, readEngineVersionLegacy } from "lib/project/engine";
import { ProjectResources } from "shared/lib/resources/types";
import { isFilePathWithinFolder } from "lib/helpers/path";

const engineIgnore = [
  "examples",
  "test",
  "obj",
  "build",
  "third-party",
  "unused",
];

const rmdir = promisify(rimraf);

type EjectOptions = {
  engineFields: EngineFieldSchema[];
  sceneTypes: SceneTypeSchema[];
  projectData: ProjectResources;
  outputRoot: string;
  projectRoot: string;
  tmpPath: string;
  compiledData: {
    files: Record<string, string>;
    usedSceneTypeIds: string[];
  };
  progress: (msg: string) => void;
  warnings: (msg: string) => void;
};

const ejectBuild = async ({
  engineFields = [],
  sceneTypes = [],
  projectData,
  outputRoot = "/tmp",
  projectRoot = "/tmp",
  tmpPath = "/tmp",
  compiledData,
  progress = (_msg) => {},
  warnings = (_msg) => {},
}: EjectOptions) => {
  const localCorePath = `${projectRoot}/assets/engine`;
  const pluginsPath = `${projectRoot}/plugins`;
  const buildToolsPath = await ensureBuildTools(tmpPath);
  const { settings } = projectData;
  const colorEnabled = settings.colorMode !== "mono";

  progress(`${l10n("COMPILER_REMOVING_FOLDER")} ${Path.basename(outputRoot)}`);
  await rmdir(outputRoot);
  await fs.ensureDir(outputRoot);
  progress(l10n("COMPILER_COPY_DEFAULT_ENGINE"));

  await copy(defaultEngineRoot, outputRoot, {
    ignore: (path) => {
      return engineIgnore.some((ignoreDir) =>
        path.startsWith(Path.join(defaultEngineRoot, ignoreDir))
      );
    },
  });

  const expectedEngineVersion = await readEngineVersion(defaultEngineMetaPath);

  try {
    progress(
      l10n("COMPILER_LOOKING_FOR_LOCAL_ENGINE", { path: "assets/engine" })
    );
    await copy(localCorePath, outputRoot);
    progress(l10n("COMPILER_COPY_LOCAL_ENGINE"));

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
    progress(l10n("COMPILER_LOCAL_ENGINE_NOT_FOUND"));
  }

  // Remove unused scene type files
  const usedSceneTypes = sceneTypes.filter((type) =>
    compiledData.usedSceneTypeIds.includes(type.key)
  );
  const unusedSceneTypes = sceneTypes.filter(
    (type) => !compiledData.usedSceneTypeIds.includes(type.key)
  );
  const usedFiles = usedSceneTypes
    .map((sceneType) => sceneType.files ?? [])
    .flat();
  const unusedFiles = unusedSceneTypes
    .map((sceneType) => sceneType.files ?? [])
    .flat()
    .filter((file) => !usedFiles.includes(file));

  for (const filename of unusedFiles) {
    const unusedFilePath = Path.join(outputRoot, filename);
    if (isFilePathWithinFolder(unusedFilePath, outputRoot)) {
      await fs.remove(unusedFilePath);
    }
  }

  progress(
    l10n("COMPILER_LOOKING_FOR_ENGINE_PLUGINS", { path: "plugins/*/engine" })
  );
  const enginePlugins = glob.sync(`${pluginsPath}/**/engine`);
  for (const enginePluginPath of enginePlugins) {
    progress(
      l10n("COMPILER_USING_ENGINE_PLUGIN", {
        path: Path.relative(pluginsPath, enginePluginPath),
      })
    );
    const pluginName = Path.basename(Path.dirname(enginePluginPath));
    try {
      const pluginEngineMetaPath = `${enginePluginPath}/engine.json`;
      const pluginEngineVersion = await readEngineVersion(pluginEngineMetaPath);
      if (!pluginEngineVersion || !isKnownEngineVersion(pluginEngineVersion)) {
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
          const engineValue =
            projectData.engineFieldValues.engineFieldValues.find(
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
  await fs.ensureDir(`${outputRoot}/src/data/sounds`);
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
