import { copy } from "fs-extra";
import Path from "path";
import os from "os";
import { rimraf as rmdir } from "rimraf";
import { program } from "commander";
import initElectronL10N from "lib/lang/initElectronL10N";
import loadProject from "lib/project/loadProjectData";
import { decompressProjectResources } from "shared/lib/resources/compression";
import { buildRunner } from "lib/compiler/buildRunner";
import { BuildType } from "lib/compiler/buildWorker";
import { loadEngineSchema } from "lib/project/loadEngineSchema";
import { getROMFilename } from "shared/lib/helpers/filePaths";
import { exportWebBuild } from "lib/compiler/webBuild";

declare const VERSION: string;

type Command = "export" | "make:rom" | "make:pocket" | "make:web";

type CLIOptions = {
  onlyData?: boolean;
  verbose?: boolean;
};

const buildTypeForCommand = (command: Command): BuildType => {
  if (command === "make:web") {
    return "web";
  }
  if (command === "make:pocket") {
    return "pocket";
  }
  return "rom";
};

const main = async (
  command: Command,
  projectFile: string,
  destination: string,
) => {
  await initElectronL10N();

  // Load project file
  const projectRoot = Path.resolve(Path.dirname(projectFile));
  const loadedProject = await loadProject(projectFile);
  const project = decompressProjectResources(loadedProject.resources);
  const buildType = buildTypeForCommand(command);

  // Load engine schema
  const engineSchema = await loadEngineSchema(projectRoot);

  // Use OS default tmp
  const tmpPath = os.tmpdir();
  const tmpBuildDir = Path.join(tmpPath, "_gbsbuild");
  const outputRoot = tmpBuildDir;

  const { onlyData, verbose } = program.opts<CLIOptions>();

  const progress = (message: string) => {
    if (verbose) {
      console.log(message);
    }
  };

  const warnings = (message: string) => {
    if (verbose) {
      console.warn(message);
    }
  };

  const colorOnly = project.settings.colorMode === "color";

  const romFilename = getROMFilename(
    project.settings.romFilename,
    project.metadata.name,
    colorOnly,
    buildType,
  );

  const { result } = buildRunner({
    project,
    buildType,
    projectRoot,
    engineSchema,
    tmpPath,
    outputRoot,
    romFilename,
    debugEnabled: project.settings.debuggerEnabled,
    make: command !== "export",
    progress,
    warnings,
  });

  await result;

  if (command === "export") {
    if (onlyData) {
      // Export src/data and include/data to destination
      const dataSrcTmpPath = Path.join(tmpBuildDir, "src", "data");
      const dataSrcOutPath = Path.join(destination, "src", "data");
      const dataIncludeTmpPath = Path.join(tmpBuildDir, "include", "data");
      const dataIncludeOutPath = Path.join(destination, "include", "data");
      await rmdir(dataSrcOutPath);
      await rmdir(dataIncludeOutPath);
      await copy(dataSrcTmpPath, dataSrcOutPath);
      await copy(dataIncludeTmpPath, dataIncludeOutPath);
    } else {
      // Export GBDK project to destination
      await copy(tmpBuildDir, destination);
    }
  } else if (command === "make:rom") {
    const romTmpPath = Path.join(tmpBuildDir, "build", "rom", romFilename);
    await copy(romTmpPath, destination);
  } else if (command === "make:pocket") {
    const romTmpPath = Path.join(tmpBuildDir, "build", "rom", romFilename);
    await copy(romTmpPath, destination);
  } else if (command === "make:web") {
    const romTmpPath = Path.join(tmpBuildDir, "build", "rom", romFilename);
    await exportWebBuild({
      project,
      projectRoot,
      destination,
      romFilename,
      romPath: romTmpPath,
      warnings,
    });
  }
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

program
  .command("make:pocket <projectFile> <destination.pocket>")
  .description("Build a Pocket from project file")
  .action((source, destination) => {
    main("make:pocket", source, destination);
  });

program
  .command("make:web <projectFile> <destination>")
  .description("Build for web from project file")
  .action((source, destination) => {
    main("make:web", source, destination);
  });

program.option("-d, --onlyData", "Only replace data folder in destination");
program.option("-v, --verbose", "Verbose output");

program.parse(process.argv);
