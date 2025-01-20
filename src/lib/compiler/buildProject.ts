import fs from "fs-extra";
import { binjgbRoot } from "consts";
import copy from "lib/helpers/fsCopy";
import type {
  EngineFieldSchema,
  SceneTypeSchema,
} from "store/features/engine/engineState";
import { ProjectResources } from "shared/lib/resources/types";
import { buildRunner } from "./buildRunner";

type BuildOptions = {
  buildType: "rom" | "web" | "pocket";
  projectRoot: string;
  tmpPath: string;
  engineFields: EngineFieldSchema[];
  sceneTypes: SceneTypeSchema[];
  outputRoot: string;
  make?: boolean;
  debugEnabled?: boolean;
  progress: (msg: string) => void;
  warnings: (msg: string) => void;
};

let cancelling = false;
let cancelFunction: (() => void) | undefined;

const buildProject = async (
  project: ProjectResources,
  {
    buildType = "rom",
    projectRoot = "/tmp",
    tmpPath = "/tmp",
    engineFields = [],
    sceneTypes = [],
    outputRoot = "/tmp/testing",
    debugEnabled = false,
    make = true,
    progress = (_msg: string) => {},
    warnings = (_msg: string) => {},
  }: BuildOptions
) => {
  cancelling = false;

  const { result, kill } = buildRunner({
    project,
    buildType,
    projectRoot,
    engineFields,
    sceneTypes,
    tmpPath,
    outputRoot,
    debugEnabled,
    make,
    progress,
    warnings,
  });

  cancelFunction = kill;
  const compiledData = await result;

  if (cancelling) {
    throw new Error("BUILD_CANCELLED");
  }

  if (buildType === "web") {
    const colorOnly = project.settings.colorMode === "color";
    const colorCorrection =
      project.settings.colorCorrection === "default" ? 2 : 0;
    const gameFile = colorOnly ? "game.gbc" : "game.gb";
    await copy(binjgbRoot, `${outputRoot}/build/web`);
    await copy(
      `${outputRoot}/build/rom/${gameFile}`,
      `${outputRoot}/build/web/rom/${gameFile}`
    );
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
    )
      .replace(/ROM_FILENAME = "[^"]*"/g, `ROM_FILENAME = "rom/${gameFile}"`)
      .replace(
        /CGB_COLOR_CURVE = [0-9]+/g,
        `CGB_COLOR_CURVE = ${colorCorrection}`
      );

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

export const cancelCompileStepsInProgress = () => {
  cancelling = true;
  if (cancelFunction) {
    cancelFunction();
  }
};

export default buildProject;
