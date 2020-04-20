import fs from "fs-extra";
import compile from "./compileData";
import ejectBuild from "./ejectBuild";
import makeBuild from "./makeBuild";
import compileMusic from "./compileMusic";
import { emulatorRoot } from "../../consts";
import copy from "../helpers/fsCopy";

const MAX_BANKS = 512; // GBDK supports max of 512 banks

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
    musicBanks: compiledData.musicBanks,
    projectRoot,
    buildRoot: outputRoot,
    progress,
    warnings
  });

  const musicBanks = compiledData.music.map((m)=> m.bank);
  const maxMusicBank = Math.max(...musicBanks);

  console.log('The last bank with music data is ' + maxMusicBank); // for cartSize, 0 if no music...

  const banksRequired = Math.max(compiledData.maxDataBank, maxMusicBank) + 1;
  
  // Determine next power of 2 for cart size based on number of banks required
  const cartSize = Math.pow(2, Math.ceil(Math.log(banksRequired) / Math.log(2)));

  if (cartSize > MAX_BANKS) {
    throw new Error(
      `Game content is over the maximum of ${MAX_BANKS} banks available. Content requires ${banksRequired} banks.`
    );
  }

  await makeBuild({
    buildRoot: outputRoot,
    buildType,
    cartSize,
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
