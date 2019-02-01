import BankedData, { MIN_DATA_BANK, GB_MAX_BANK_SIZE } from "./bankedData";
import { walkScenesEvents } from "../../helpers/eventSystem";
import compileImages from "./compileImages";
import { indexArray } from "../../helpers/array";
import ggbgfx from "./ggbgfx";

const compile = async (
  projectData,
  {
    projectRoot = "/tmp",
    bankSize = GB_MAX_BANK_SIZE,
    bankOffset = MIN_DATA_BANK
  } = {}
) => {
  const output = {};
  const banked = new BankedData(bankSize);

  const precompiled = await precompile(projectData, projectRoot);

  const bankHeader = banked.exportCHeader(bankOffset);
  const bankData = banked.exportCData(bankOffset);

  output[`banks.h`] = bankHeader;
  bankData.forEach((bankDataBank, index) => {
    output[`bank_${bankOffset + index}`] = bankDataBank;
  });

  return output;
};

//#region precompile

const precompile = async (projectData, projectRoot) => {
  const flags = precompileFlags(projectData.scenes);
  const strings = precompileStrings(projectData.scenes);
  const { usedImages, imageLookup, imageData } = await precompileImages(
    projectData.images,
    projectData.scenes,
    projectRoot
  );
  const { usedSprites, spriteLookup, spriteData } = await precompileSprites(
    projectData.spriteSheets,
    projectData.scenes,
    projectRoot
  );
  //   await precompileMaps(world);
  //   await precompileScript(world);

  return {
    flags,
    strings,
    usedImages,
    imageLookup,
    imageData
  };
};

export const precompileFlags = scenes => {
  let flags = [];
  walkScenesEvents(scenes, cmd => {
    if (cmd.args && cmd.args.flag) {
      if (flags.indexOf(cmd.args.flag) === -1) {
        flags.push(cmd.args.flag);
      }
    }
  });
  return flags;
};

export const precompileStrings = scenes => {
  let strings = [];
  walkScenesEvents(scenes, cmd => {
    if (cmd.args && cmd.args.text) {
      // If never seen this string before add it to the list
      if (strings.indexOf(cmd.args.text) === -1) {
        strings.push(cmd.args.text);
      }
    }
  });
  return strings;
};

export const precompileImages = async (images, scenes, projectRoot) => {
  const usedImages = images.filter(image =>
    scenes.find(scene => scene.imageId === image.id)
  );
  const imageLookup = indexArray(usedImages, "id");
  const imageData = await compileImages(usedImages, projectRoot);
  return {
    usedImages,
    imageLookup,
    imageData
  };
};

const precompileSprites = async (spriteSheets, scenes, projectRoot) => {
  const usedSprites = spriteSheets.filter(spriteSheet =>
    scenes.find(scene =>
      scene.actors.find(actor => actor.spriteSheetId === spriteSheet.id)
    )
  );
  const spriteLookup = indexArray(usedSprites, "id");
  const spriteData = await Promise.all(
    usedSprites.map(async spriteSheet => {
      const data = await ggbgfx.imageToSpriteString(
        `${projectRoot}/assets/sprites/${spriteSheet.filename}`
      );
      return {
        ...spriteSheet,
        data,
        size: data.split(",").length
      };
    })
  );
  return {
    usedSprites,
    spriteLookup,
    spriteData
  };
};

//#endregion

export default compile;
