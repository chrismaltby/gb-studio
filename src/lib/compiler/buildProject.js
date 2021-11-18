import fs from "fs-extra";
import compile from "./compileData";
import ejectBuild from "./ejectBuild";
import makeBuild from "./makeBuild";
import { binjgbRoot, emulatorRoot } from "../../consts";
import copy from "../helpers/fsCopy";

const buildProject = async (
  data,
  {
    buildType = "rom",
    projectRoot = "/tmp",
    tmpPath = "/tmp",
    profile = false,
    engineFields = [],
    exportBuild = false,
    outputRoot = "/tmp/testing",
    progress = (_msg) => {},
    warnings = (_msg) => {},
  } = {}
) => {
  const compiledData = await compile(data, {
    projectRoot,
    engineFields,
    tmpPath,
    progress,
    warnings,
  });
  await ejectBuild({
    projectRoot,
    tmpPath,
    projectData: data,
    engineFields,
    outputRoot,
    compiledData,
    progress,
    warnings,
  });
  await makeBuild({
    buildRoot: outputRoot,
    tmpPath,
    buildType,
    data,
    profile,
    progress,
    warnings,
  });
  if (buildType === "web") {
    await copy(binjgbRoot, `${outputRoot}/build/web`);
    await copy(
      `${outputRoot}/build/rom/game.gb`,
      `${outputRoot}/build/web/rom/game.gb`
    );
    const sanitize = (s) => String(s || "").replace(/["<>]/g, "");
    const projectName = sanitize(data.name);
    const author = sanitize(data.author);
    const colorsHead = data.settings.customColorsEnabled
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

    await fs.writeFile(`${outputRoot}/build/web/index.html`, html);
  } else if (buildType === "pocket") {
    await fs.mkdir(`${outputRoot}/build/pocket`);
    await copy(
      `${outputRoot}/build/rom/game.pocket`,
      `${outputRoot}/build/pocket/game.pocket`
    );
  }
};

export default buildProject;
