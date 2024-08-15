import fs from "fs-extra";
import compile from "./compileData";
import ejectBuild from "./ejectBuild";
import makeBuild from "./makeBuild";
import { binjgbRoot } from "consts";
import copy from "lib/helpers/fsCopy";
import type {
  EngineFieldSchema,
  SceneTypeSchema,
} from "store/features/engine/engineState";
import { ScriptEventHandlers } from "lib/project/loadScriptEventHandlers";
import { validateEjectedBuild } from "lib/compiler/validate/validateEjectedBuild";
import { ProjectResources } from "shared/lib/resources/types";

type BuildOptions = {
  buildType: "rom" | "web" | "pocket";
  projectRoot: string;
  tmpPath: string;
  engineFields: EngineFieldSchema[];
  scriptEventHandlers: ScriptEventHandlers;
  sceneTypes: SceneTypeSchema[];
  outputRoot: string;
  debugEnabled?: boolean;
  progress: (msg: string) => void;
  warnings: (msg: string) => void;
};

const buildProject = async (
  data: ProjectResources,
  {
    buildType = "rom",
    projectRoot = "/tmp",
    tmpPath = "/tmp",
    engineFields = [],
    scriptEventHandlers,
    sceneTypes = [],
    outputRoot = "/tmp/testing",
    debugEnabled = false,
    progress = (_msg: string) => {},
    warnings = (_msg: string) => {},
  }: BuildOptions
) => {
  const compiledData = await compile(data, {
    projectRoot,
    engineFields,
    scriptEventHandlers,
    sceneTypes,
    tmpPath,
    debugEnabled,
    progress,
    warnings,
  });
  await ejectBuild({
    projectType: "gb",
    projectRoot,
    tmpPath,
    projectData: data,
    engineFields,
    sceneTypes,
    outputRoot,
    compiledData,
    progress,
    warnings,
  });
  await validateEjectedBuild({
    buildRoot: outputRoot,
    progress,
    warnings,
  });
  await makeBuild({
    buildRoot: outputRoot,
    tmpPath,
    buildType,
    data,
    debug: data.settings.generateDebugFilesEnabled,
    progress,
    warnings,
  });
  if (buildType === "web") {
    const colorOnly = data.settings.colorMode === "color";
    const gameFile = colorOnly ? "game.gbc" : "game.gb";
    await copy(binjgbRoot, `${outputRoot}/build/web`);
    await copy(
      `${outputRoot}/build/rom/${gameFile}`,
      `${outputRoot}/build/web/rom/${gameFile}`
    );
    const sanitize = (s: string) => String(s || "").replace(/["<>]/g, "");
    const projectName = sanitize(data.metadata.name);
    const author = sanitize(data.metadata.author);
    const colorsHead =
      data.settings.colorMode !== "mono"
        ? `<style type="text/css"> body { background-color:#${data.settings.customColorsBlack}; }</style>`
        : "";
    const customHead = data.settings.customHead || "";
    const customControls = JSON.stringify({
      up: data.settings.customControlsUp,
      down: data.settings.customControlsDown,
      left: data.settings.customControlsLeft,
      right: data.settings.customControlsRight,
      a: data.settings.customControlsA,
      b: data.settings.customControlsB,
      start: data.settings.customControlsStart,
      select: data.settings.customControlsSelect,
    });
    const html = (
      await fs.readFile(`${outputRoot}/build/web/index.html`, "utf8")
    )
      .replace(/___PROJECT_NAME___/g, projectName)
      .replace(/___AUTHOR___/g, author)
      .replace(/___COLORS_HEAD___/g, colorsHead)
      .replace(/___PROJECT_HEAD___/g, customHead)
      .replace(/___CUSTOM_CONTROLS___/g, customControls);

    const scriptJs = (
      await fs.readFile(`${outputRoot}/build/web/js/script.js`, "utf8")
    ).replace(/ROM_FILENAME = "[^"]*"/g, `ROM_FILENAME = "rom/${gameFile}"`);

    await fs.writeFile(`${outputRoot}/build/web/index.html`, html);
    await fs.writeFile(`${outputRoot}/build/web/js/script.js`, scriptJs);
  } else if (buildType === "pocket") {
    await fs.mkdir(`${outputRoot}/build/pocket`);
    await copy(
      `${outputRoot}/build/rom/game.pocket`,
      `${outputRoot}/build/pocket/game.pocket`
    );
  }
  return compiledData;
};

export default buildProject;
