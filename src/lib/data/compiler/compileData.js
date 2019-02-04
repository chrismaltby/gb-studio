import BankedData, { MIN_DATA_BANK, GB_MAX_BANK_SIZE } from "./bankedData";
import { walkScenesEvents } from "../../helpers/eventSystem";
import compileImages from "./compileImages";
import { indexArray } from "../../helpers/array";
import ggbgfx from "./ggbgfx";
import { hi, lo } from "../../helpers/8bit";
import compileEntityScript from "./precompileEntityEvents";

const STRINGS_PER_BANK = 430;

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

const quoteString = s => `"${s.replace(/"/g, '\\"')}"`;

const compile = async (
  projectData,
  {
    projectRoot = "/tmp",
    bankSize = GB_MAX_BANK_SIZE,
    bankOffset = MIN_DATA_BANK,
    stringsPerBank = STRINGS_PER_BANK,
    eventEmitter = noopEmitter
  } = {}
) => {
  eventEmitter.emit(EVENT_START_DATA_COMPILE);

  const output = {};

  const precompiled = await precompile(projectData, projectRoot, eventEmitter);

  // Strings
  const stringsLength = precompiled.strings.length;
  const stringNumBanks = Math.ceil(stringsLength / stringsPerBank);
  const stringBanks = [];
  for (let i = 0; i < stringNumBanks; i++) {
    stringBanks.push(
      precompiled.strings.slice(
        i * stringsPerBank,
        i * stringsPerBank + stringsPerBank
      )
    );
  }

  const banked = new BankedData({
    bankSize,
    bankOffset: bankOffset + stringBanks.length
  });

  // Add script data
  let scriptPtrs = projectData.scenes.map(scene => {
    return {
      actors: scene.actors.map(actor => {
        const output = compileEntityScript(actor.events, {
          scene,
          strings: precompiled.strings,
          flags: precompiled.flags,
          ptrOffset: banked.currentBankSize()
        });
        if (banked.dataWillFitCurrentBank(output)) {
          return banked.push(output);
        } else {
          const outputNewBank = compileEntityScript(actor.events, {
            scene,
            strings: precompiled.strings,
            flags: precompiled.flags
          });
          return banked.push(output);
        }
      })
    };
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

  let scenePtrs = precompiled.sceneData.map(scene => {
    return banked.push(
      [].concat(
        hi(scene.imageIndex),
        lo(scene.imageIndex),
        scene.sprites.length,
        scene.actors.length,
        scene.triggers.length,
        scene.collisions,
        scene.actorsData,
        scene.triggersData
      )
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

  console.log(
    JSON.stringify({ scriptPtrs, tileSetPtrs, imagePtrs, scenePtrs }, null, 4)
  );

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

  stringBanks.forEach((bankStrings, index) => {
    output[`strings_${bankOffset + index}.c`] = `#pragma bank=${bankOffset +
      index}\n\nconst unsigned char strings[][38] = {\n${bankStrings
      .map(quoteString)
      .join(",\n")}\n};\n`;
  });

  bankData.forEach((bankDataBank, index) => {
    output[`bank_${bankOffset + stringBanks.length + index}.c`] = bankDataBank;
  });

  // console.log(output);

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
  const sceneData = precompileScenes(
    projectData.scenes,
    usedImages,
    spriteData
  );

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
    usedTilesets,
    // usedTilesetLookup,
    imageLookup
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

export const precompileScenes = (scenes, usedImages, spriteData) => {
  const scenesData = scenes.map(scene => {
    return {
      ...scene,
      imageIndex: usedImages.findIndex(image => image.id === scene.imageId),
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
      }, []),
      actorsData: [],
      triggersData: []
    };
  });
  return scenesData;
};

//#endregion

export default compile;
