import fs from "fs-extra";
import compile from "./compileData";
import ejectBuild from "./ejectBuild";
import makeBuild from "./makeBuild";
import compileMusic from "./compileMusic";
import { emulatorRoot } from "../../consts";
import copy from "../helpers/fsCopy";

const buildProject = async (
  data,
  {
    buildType = "rom",
    projectRoot = "/tmp",
    tmpPath = "/tmp",
    outputRoot = "/tmp/testing",
    progress = () => {},
    warnings = () => {}
  } = {}
) => {
  const compiledData = await compile(data, {
    projectRoot,
    tmpPath,
    progress,
    warnings
  });
  await ejectBuild({
    outputRoot,
    compiledData,
    progress,
    warnings
  });
  await compileMusic({
    music: compiledData.music,
    projectRoot,
    buildRoot: outputRoot,
    progress,
    warnings
  });
  await makeBuild({
    buildRoot: outputRoot,
    buildType,
    data,
    progress,
    warnings
  });
  if (buildType === "web") {
    await copy(emulatorRoot, `${outputRoot}/build/web`);
    await copy(
      `${outputRoot}/build/rom/game.gb`,
      `${outputRoot}/build/web/rom/game.gb`
    );
    const sanitize = s => String(s || "").replace(/["<>]/g, "");
    const projectName = sanitize(data.name);
    const author = sanitize(data.author);
    const colorsHead = data.settings.customColorsEnabled
      ? `<style type="text/css"> body { background-color:#${
          data.settings.customColorsBlack
        }; }</style>`
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
      select: data.settings.customControlsSelect
    });
    const html = (await fs.readFile(
      `${outputRoot}/build/web/index.html`,
      "utf8"
    ))
      .replace(/___PROJECT_NAME___/g, projectName)
      .replace(/___AUTHOR___/g, author)
      .replace(/___COLORS_HEAD___/g, colorsHead)
      .replace(/___PROJECT_HEAD___/g, customHead)
      .replace(/___CUSTOM_CONTROLS___/g, customControls);

    await fs.writeFile(`${outputRoot}/build/web/index.html`, html);
  }
};

export default buildProject;
