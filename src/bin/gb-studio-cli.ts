import { copy, readFile, writeFile } from "fs-extra";
import Path from "path";
import os from "os";
import rimraf from "rimraf";
import { promisify } from "util";
import { program } from "commander";
import { binjgbRoot } from "consts";
import compileData from "lib/compiler/compileData";
import ejectBuild from "lib/compiler/ejectBuild";
import makeBuild from "lib/compiler/makeBuild";
import initElectronL10N from "lib/lang/initElectronL10N";
import { loadEngineFields } from "lib/project/engineFields";
import loadAllScriptEventHandlers from "lib/project/loadScriptEventHandlers";
import { validateEjectedBuild } from "lib/compiler/validate/validateEjectedBuild";
import { loadSceneTypes } from "lib/project/sceneTypes";
import loadProject from "lib/project/loadProjectData";
import { decompressProjectResources } from "shared/lib/resources/compression";

const rmdir = promisify(rimraf);

declare const VERSION: string;

type Command = "export" | "make:rom" | "make:pocket" | "make:web";

const main = async (
  command: Command,
  projectFile: string,
  destination: string
) => {
  initElectronL10N();

  // Load project file
  const projectRoot = Path.resolve(Path.dirname(projectFile));
  const loadedProject = await loadProject(projectFile);
  const project = decompressProjectResources(loadedProject.resources);

  // Load script event handlers + plugins
  const scriptEventHandlers = await loadAllScriptEventHandlers(projectRoot);

  // Load engine fields
  const engineFields = await loadEngineFields(projectRoot);
  const sceneTypes = await loadSceneTypes(projectRoot);

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
    scriptEventHandlers,
    sceneTypes,
    tmpPath,
    progress,
    warnings,
  });

  // Export compiled data to a folder
  await ejectBuild({
    projectType: "gb",
    projectRoot,
    projectData: project,
    engineFields,
    sceneTypes,
    outputRoot: tmpBuildDir,
    tmpPath,
    compiledData,
    progress,
    warnings,
  });

  await validateEjectedBuild({
    buildRoot: tmpBuildDir,
    progress,
    warnings,
  });

  const colorOnly = project.settings.colorMode === "color";
  const gameFile = colorOnly ? "game.gbc" : "game.gb";

  if (command === "export") {
    if (program.onlyData) {
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
    // Export ROM to destination
    await makeBuild({
      buildRoot: tmpBuildDir,
      tmpPath,
      data: project,
      debug: false,
      buildType: "rom",
      progress,
      warnings,
    });
    const romTmpPath = Path.join(tmpBuildDir, "build", "rom", gameFile);
    await copy(romTmpPath, destination);
  } else if (command === "make:pocket") {
    // Export ROM to destination
    await makeBuild({
      buildRoot: tmpBuildDir,
      tmpPath,
      data: project,
      debug: false,
      buildType: "pocket",
      progress,
      warnings,
    });
    const romTmpPath = Path.join(tmpBuildDir, "build", "rom", "game.pocket");
    await copy(romTmpPath, destination);
  } else if (command === "make:web") {
    // Export web build to destination
    await makeBuild({
      buildRoot: tmpBuildDir,
      tmpPath,
      data: project,
      debug: false,
      buildType: "web",
      progress,
      warnings,
    });
    const romTmpPath = Path.join(tmpBuildDir, "build", "rom", gameFile);
    await copy(binjgbRoot, destination);
    await copy(romTmpPath, `${destination}/rom/${gameFile}`);
    const sanitize = (s: string) => String(s || "").replace(/["<>]/g, "");
    const projectName = sanitize(project.metadata.name);
    const author = sanitize(project.metadata.author);
    const colorsHead =
      project.settings.colorMode !== "mono"
        ? `<style type="text/css"> body { background-color:#${project.settings.customColorsBlack}; }</style>`
        : "";
    const customHead = project.settings.customHead || "";
    const customControls = JSON.stringify({
      up: project.settings.customControlsUp,
      down: project.settings.customControlsDown,
      left: project.settings.customControlsLeft,
      right: project.settings.customControlsRight,
      a: project.settings.customControlsA,
      b: project.settings.customControlsB,
      start: project.settings.customControlsStart,
      select: project.settings.customControlsSelect,
    });
    const html = (await readFile(`${destination}/index.html`, "utf8"))
      .replace(/___PROJECT_NAME___/g, projectName)
      .replace(/___AUTHOR___/g, author)
      .replace(/___COLORS_HEAD___/g, colorsHead)
      .replace(/___PROJECT_HEAD___/g, customHead)
      .replace(/___CUSTOM_CONTROLS___/g, customControls);

    const scriptJs = (
      await readFile(`${destination}/js/script.js`, "utf8")
    ).replace(/ROM_FILENAME = "[^"]*"/g, `ROM_FILENAME = "rom/${gameFile}"`);

    await writeFile(`${destination}/index.html`, html);
    await writeFile(`${destination}/js/script.js`, scriptJs);
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
