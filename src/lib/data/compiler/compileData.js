import BankedData, { MIN_DATA_BANK, GB_MAX_BANK_SIZE } from "./bankedData";
import { walkScenesEvents } from "../../helpers/eventSystem";
import compileImages from "./compileImages";
import { indexArray } from "../../helpers/array";
import ggbgfx from "./ggbgfx";

export const EVENT_START_DATA_COMPILE = "EVENT_START_DATA_COMPILE";
export const EVENT_DATA_COMPILE_PROGRESS = "EVENT_DATA_COMPILE_PROGRESS";
export const EVENT_END_DATA_COMPILE = "EVENT_END_DATA_COMPILE";

export const EVENT_MSG_PRE_FLAGS = "Preparing flags...";
export const EVENT_MSG_PRE_STRINGS = "Preparing strings...";
export const EVENT_MSG_PRE_IMAGES = "Preparing images...";
export const EVENT_MSG_PRE_SPRITES = "Preparing sprites...";
export const EVENT_MSG_PRE_SCENES = "Preparing scenes...";
export const EVENT_MSG_PRE_EVENTS = "Preparing events...";
export const EVENT_MSG_PRE_COMPLETE = "Preparation complete";

const noopEmitter = {
  emit: () => {}
};

const compile = async (
  projectData,
  {
    projectRoot = "/tmp",
    bankSize = GB_MAX_BANK_SIZE,
    bankOffset = MIN_DATA_BANK,
    eventEmitter = noopEmitter
  } = {}
) => {
  eventEmitter.emit(EVENT_START_DATA_COMPILE);

  const output = {};
  const banked = new BankedData(bankSize);

  const precompiled = await precompile(projectData, projectRoot, eventEmitter);

  const bankHeader = banked.exportCHeader(bankOffset);
  const bankData = banked.exportCData(bankOffset);

  output[`banks.h`] = bankHeader;
  bankData.forEach((bankDataBank, index) => {
    output[`bank_${bankOffset + index}`] = bankDataBank;
  });

  eventEmitter.emit(EVENT_END_DATA_COMPILE);

  return output;
};

//#region precompile

const precompile = async (projectData, projectRoot, eventEmitter) => {
  eventEmitter.emit(EVENT_DATA_COMPILE_PROGRESS, EVENT_MSG_PRE_FLAGS);
  const flags = precompileFlags(projectData.scenes);

  eventEmitter.emit(EVENT_DATA_COMPILE_PROGRESS, EVENT_MSG_PRE_STRINGS);
  const strings = precompileStrings(projectData.scenes);

  eventEmitter.emit(EVENT_DATA_COMPILE_PROGRESS, EVENT_MSG_PRE_IMAGES);
  const { usedImages, imageLookup, imageData } = await precompileImages(
    projectData.images,
    projectData.scenes,
    projectRoot
  );

  eventEmitter.emit(EVENT_DATA_COMPILE_PROGRESS, EVENT_MSG_PRE_SPRITES);
  const { usedSprites, spriteLookup, spriteData } = await precompileSprites(
    projectData.spriteSheets,
    projectData.scenes,
    projectRoot
  );

  eventEmitter.emit(EVENT_DATA_COMPILE_PROGRESS, EVENT_MSG_PRE_SCENES);
  const sceneData = precompileScenes(projectData.scenes, imageData, spriteData);
  //   await precompileScript(world);

  eventEmitter.emit(EVENT_DATA_COMPILE_PROGRESS, EVENT_MSG_PRE_COMPLETE);

  return {
    flags,
    strings,
    usedImages,
    imageLookup,
    imageData,
    sceneData
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

export const precompileSprites = async (spriteSheets, scenes, projectRoot) => {
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

export const precompileScenes = (scenes, imageData, spriteData) => {
  const scenesData = scenes.map(scene => {
    return {
      ...scene,
      tilemap: imageData.tilemaps[scene.imageId],
      tileset: imageData.tilemapsTileset[scene.imageId],
      sprites: scene.actors.reduce((memo, actor) => {
        const spriteIndex = spriteData.findIndex(
          sprite => sprite.id === actor.spriteSheetId
        );
        if (memo.indexOf(spriteIndex) === -1) {
          memo.push(spriteIndex);
        }
        return memo;
      }, [])
    };
  });
  return scenesData;
};

//#endregion

export default compile;
