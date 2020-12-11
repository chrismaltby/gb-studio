import { copy, readJSON } from "fs-extra";
import Path from "path";
import os from "os";
import { program } from "commander";
import { engineRoot } from "../consts";
import { EngineFieldSchema } from "../store/features/engine/engineState";
import { initPlugins } from "../lib/plugins/plugins";
import compileData from "../lib/compiler/compileData";
import ejectBuild from "../lib/compiler/ejectBuild";
import makeBuild from "../lib/compiler/makeBuild";

declare var VERSION: any;

interface EngineData {
  fields?: EngineFieldSchema[];
}

type Command = "export" | "make:rom";

const main = async (
  command: Command,
  projectFile: string,
  destination: string
) => {
  // Load project file
  const projectRoot = Path.resolve(Path.dirname(projectFile));
  const project = await readJSON(projectFile);

  // Load plugins
  initPlugins(projectRoot);

  // Load engine fields
  const engineFields = await getEngineFields(projectRoot);

  // Use OS default tmp
  const tmpPath = os.tmpdir();
  const tmpBuildDir = Path.join(tmpPath, "_gbsbuild");

  const progress = (message: string) => {
    if (program.verbose) {
      console.log(message);
    }
  };

  const warnings = (message: string) => {
    if (program.verbose) {
      console.warn(message);
    }
  };

  // Compile project data
  const compiledData = await compileData(project, {
    projectRoot,
    engineFields,
    tmpPath,
    progress,
    warnings,
  });

  // Export compiled data to a folder
  await ejectBuild({
    projectRoot,
    outputRoot: tmpBuildDir,
    compiledData,
    progress,
    warnings,
  });

  if (command === "export") {
    if (program.onlyData) {
      // Export src/data and include/data to destination
      const dataSrcTmpPath = Path.join(tmpBuildDir, "src", "data");
      const dataSrcOutPath = Path.join(destination, "src", "data");
      const dataIncludeTmpPath = Path.join(tmpBuildDir, "include", "data");
      const dataIncludeOutPath = Path.join(destination, "include", "data");
      await copy(dataSrcTmpPath, dataSrcOutPath);
      await copy(dataIncludeTmpPath, dataIncludeOutPath);
    } else {
      // Export GBDK project to destination
      await copy(tmpBuildDir, destination);
    }
  } else if (command === "make:rom") {
    // Export ROM to destination
    await makeBuild({
      buildRoot: tmpBuildDir,
      tmpPath,
      data: project,
      profile: false,
      progress,
      warnings,
    });
    const romTmpPath = Path.join(tmpBuildDir, "build", "rom", "game.gb");
    await copy(romTmpPath, destination);
  }
};

const getEngineFields = async (projectRoot: string) => {
  const defaultEngineJsonPath = Path.join(engineRoot, "gb", "engine.json");
  const localEngineJsonPath = Path.join(
    Path.dirname(projectRoot),
    "assets",
    "engine",
    "engine.json"
  );
  let defaultEngine: EngineData = {};
  let localEngine: EngineData = {};
  try {
    localEngine = await readJSON(localEngineJsonPath);
  } catch (e) {
    defaultEngine = await readJSON(defaultEngineJsonPath);
  }
  let fields: EngineFieldSchema[] = [];

  if (localEngine && localEngine.fields) {
    fields = localEngine.fields;
  } else if (defaultEngine && defaultEngine.fields) {
    fields = defaultEngine.fields;
  }

  return fields;
};

program.version(VERSION);

program
  .command("export <projectFile> <destination>")
  .description("Export a project file to a GBDK project with engine and data")
  .action((source, destination) => {
    main("export", source, destination);
  });

program
  .command("make:rom <projectFile> <destination.gb>")
  .description("Build a ROM from project file")
  .action((source, destination) => {
    main("make:rom", source, destination);
  });

program.option("-d, --onlyData", "Only replace data folder in destination");
program.option("-v, --verbose", "Verbose output");

program.parse(process.argv);
