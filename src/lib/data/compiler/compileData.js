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

  const a = banked.push([1, 2, 3]);
  console.log({
    a,
    usedImages: precompiled.usedImages,
    imageData: precompiled.imageData,
    usedTilesets: precompiled.usedTilesets,
    usedTilesetLookup: precompiled.usedTilesetLookup
  });

  // Add tileset data
  let tileSetPtrs = precompiled.usedTilesets.map((tileset, tilesetIndex) => {
    return banked.push(tileset);
  });

  let imagePtrs = precompiled.usedImages.map(image => {
    return banked.push(
      [].concat(image.tilesetIndex, image.width, image.height, image.data)
    );
  });

  // let tileMapPtrs = {};
  // Object.keys(precompiled.imageData.tilemaps).map(tileMapKey => {
  //   tileMapPtrs[tileMapKey] = banked.push(
  //     precompiled.imageData.tilemaps[tileMapKey]
  //   );
  // });

  // banked.nextBank();

  // let scenePtrs = [];
  // precompiled.sceneData.map(scene => {
  //   console.log(scene);
  //   const sceneData = [].concat([scene.width, scene.height]);
  //   scenePtrs.push(banked.push(sceneData));
  // });

  console.log({ tileSetPtrs, imagePtrs });

  // console.log(tileMapPtrs);
  // console.log(scenePtrs);

  // precompiled.usedImages.forEach((image, imageIndex) => {
  //   const bankPtr = image.
  // })

  // projectData.scenes.forEach((scene, sceneIndex) => {
  //   const bankPtr =
  // })

  const bankHeader = banked.exportCHeader(bankOffset);
  const bankData = banked.exportCData(bankOffset);

  output[`banks.h`] = bankHeader;
  bankData.forEach((bankDataBank, index) => {
    output[`bank_${bankOffset + index}`] = bankDataBank;
  });

  console.log(output);

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
  const {
    usedImages,
    imageLookup,
    imageData,
    usedTilesets,
    usedTilesetLookup
  } = await precompileImages(
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
    usedTilesets,
    usedTilesetLookup,
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
  let usedTilesets = [];
  let usedTilesetLookup = {};
  Object.keys(imageData.tilesets).forEach(tileKey => {
    usedTilesetLookup[tileKey] = usedTilesets.length;
    usedTilesets.push(imageData.tilesets[tileKey]);
  });
  const usedImagesWithData = usedImages.map(image => {
    return {
      ...image,
      tilesetIndex: usedTilesetLookup[imageData.tilemapsTileset[image.id]],
      data: imageData.tilemaps[image.id]
    };
  });
  return {
    usedImages: usedImagesWithData,
    usedTilesets
    // usedTilesetLookup,
    // imageLookup,
    // imageData
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
      // tilemap: imageData.tilemaps[scene.imageId],
      // tileset: imageData.tilemapsTileset[scene.imageId],
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

/*
const precompileScript = world => {
  world._data.scriptLookup = {};
  world._data.script = [CMD_LOOKUP["END"]];
  world.scenes.forEach(map => {
    world._data.scriptLookup[map.id] = { actors: {}, triggers: {} };
    map.actors.forEach((actor, i) => {
      if (actor.script && actor.script.length > 1) {
        // Had a script
        world._data.scriptLookup[map.id].actors[i] = world._data.script.length;
        world._data.script = precompileEntityScript(
          actor.script,
          world._data.script,
          world._data,
          map.id
        );
      } else {
        // No script
        world._data.scriptLookup[map.id].actors[i] = SCRIPT_MAX;
      }
    });
    map.triggers.forEach((trigger, i) => {
      if (trigger.script && trigger.script.length > 1) {
        // Had a script
        world._data.scriptLookup[map.id].triggers[i] =
          world._data.script.length;
        world._data.script = precompileEntityScript(
          trigger.script,
          world._data.script,
          world._data,
          map.id
        );
      } else {
        // No script
        world._data.scriptLookup[map.id].triggers[i] = SCRIPT_MAX;
      }
    });
  });
};
*/

//#endregion

export default compile;
