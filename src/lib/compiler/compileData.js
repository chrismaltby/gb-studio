import BankedData, { MIN_DATA_BANK, GB_MAX_BANK_SIZE } from "./bankedData";
import { walkScenesEvents } from "../helpers/eventSystem";
import compileImages from "./compileImages";
import { indexArray } from "../helpers/array";
import ggbgfx from "./ggbgfx";
import { hi, lo, decHex16, decHex } from "../helpers/8bit";
import compileEntityEvents from "./precompileEntityEvents";

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

const prepareString = s =>
  `"${s
    .toUpperCase()
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")}"`;

const flatten = arr => [].concat(...arr);

const compile = async (
  projectData,
  {
    projectRoot = "/tmp",
    bankSize = GB_MAX_BANK_SIZE,
    bankOffset = MIN_DATA_BANK,
    stringsPerBank = STRINGS_PER_BANK,
    progress = () => {},
    warnings = () => {}
  } = {}
) => {
  const output = {};

  const precompiled = await precompile(projectData, projectRoot, progress);

  // Strings
  const stringsLength = precompiled.strings.length;
  // console.log({ stringsLength });
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

  // Add event data
  const eventPtrs = projectData.scenes.map(scene => {
    const bankEntityEvents = entity => {
      const output = compileEntityEvents(entity.script, {
        scene,
        strings: precompiled.strings,
        flags: precompiled.flags,
        ptrOffset: banked.currentBankSize()
      });
      if (banked.dataWillFitCurrentBank(output)) {
        return banked.push(output);
      } else {
        const outputNewBank = compileEntityEvents(entity.script, {
          scene,
          strings: precompiled.strings,
          flags: precompiled.flags
        });
        return banked.push(output);
      }
    };
    return {
      actors: scene.actors.map(bankEntityEvents),
      triggers: scene.triggers.map(bankEntityEvents)
    };
  });

  // Add tileset data
  const tileSetPtrs = precompiled.usedTilesets.map((tileset, tilesetIndex) => {
    return banked.push([].concat(Math.ceil(tileset.length / 16), tileset));
  });

  // Add image map data
  const imagePtrs = precompiled.usedImages.map(image => {
    return banked.push(
      [].concat(image.tilesetIndex, image.width, image.height, image.data)
    );
  });

  // Add sprite data
  const spritePtrs = precompiled.usedSprites.map(sprite => {
    return banked.push([].concat(sprite.frames, sprite.data));
  });

  // Add scene data
  const scenePtrs = precompiled.sceneData.map((scene, sceneIndex) => {
    return banked.push(
      [].concat(
        hi(scene.imageIndex),
        lo(scene.imageIndex),
        scene.sprites.length,
        scene.sprites,
        scene.actors.length,
        compileActors(scene.actors, {
          eventPtrs: eventPtrs[sceneIndex].actors,
          sprites: precompiled.usedSprites
        }),
        scene.triggers.length,
        compileTriggers(scene.triggers, {
          eventPtrs: eventPtrs[sceneIndex].triggers
        }),
        scene.collisions.slice(0, Math.ceil((scene.width * scene.height) / 8))
      )
    );
  });

  const startSceneIndex = precompiled.sceneData.findIndex(
    m => m.id === projectData.startSceneId
  );
  const startX = projectData.startX;
  const startY = projectData.startY;

  // console.log(
  //   JSON.stringify(
  //     { eventPtrs, tileSetPtrs, imagePtrs, spritePtrs, scenePtrs },
  //     null,
  //     4
  //   )
  // );

  const bankNums = [
    ...Array(bankOffset + stringBanks.length + banked.data.length).keys()
  ];

  const bankDataPtrs = bankNums.map(bankNum => {
    return bankNum >= bankOffset + stringBanks.length
      ? `&bank_${bankNum}_data`
      : 0;
  });

  // console.log({ bankNums, bankDataPtrs });

  const dataPtrs = {
    tileset_bank_ptrs: tileSetPtrs,
    image_bank_ptrs: imagePtrs,
    sprite_bank_ptrs: spritePtrs,
    scene_bank_ptrs: scenePtrs
  };

  const bankHeader = banked.exportCHeader(bankOffset);
  const bankData = banked.exportCData(bankOffset);

  // console.log(stringBanks.length);
  // console.log(
  //   stringBanks.map((bankStrings, index) => {
  //     return `extern const unsigned char strings_${bankOffset + index}[][38];`;
  //   })
  // );

  output[`data_ptrs.h`] =
    `#ifndef DATA_PTRS_H\n#define DATA_PTRS_H\n\n` +
    `typedef struct _BANK_PTR {\n` +
    `  unsigned char bank;\n` +
    `  unsigned int offset;\n` +
    `} BANK_PTR;\n\n` +
    `#define START_SCENE_INDEX ${decHex16(startSceneIndex)}\n` +
    `#define START_SCENE_X ${decHex(startX)}\n` +
    `#define START_SCENE_Y ${decHex(startY)}\n` +
    `#define START_SCENE_DIR ${decHex(1)}\n\n` +
    Object.keys(dataPtrs)
      .map(name => {
        return `extern const BANK_PTR ${name}[];`;
      })
      .join(`\n`) +
    `\n` +
    `extern const unsigned char *bank_data_ptrs[];\n` +
    `extern unsigned char script_flags[${precompiled.flags.length + 1}];\n` +
    stringBanks
      .map((bankStrings, index) => {
        return `extern const unsigned char strings_${bankOffset +
          index}[][38];`;
      })
      .join(`\n`) +
    `\n\n#endif\n`;

  output[`data_ptrs.c`] =
    `#pragma bank=16\n` +
    `#include "data_ptrs.h"\n` +
    `#include "banks.h"\n\n` +
    `const unsigned char *bank_data_ptrs[] = {\n` +
    bankDataPtrs.join(",") +
    "\n};\n\n" +
    Object.keys(dataPtrs)
      .map(name => {
        return (
          `const BANK_PTR ${name}[] = {\n` +
          dataPtrs[name]
            .map(dataPtr => {
              return `{${decHex(dataPtr.bank)},${decHex16(dataPtr.offset)}}`;
            })
            .join(",") +
          `\n};\n`
        );
      })
      .join(`\n`) +
    `\nunsigned char script_flags[${precompiled.flags.length + 1}] = { 0 };\n`;

  output[`banks.h`] = bankHeader;

  stringBanks.forEach((bankStrings, index) => {
    output[`strings_${bankOffset + index}.c`] = `#pragma bank=${bankOffset +
      index}\n\nconst unsigned char strings_${bankOffset +
      index}[][38] = {\n${bankStrings.map(prepareString).join(",\n")}\n};\n`;
  });

  bankData.forEach((bankDataBank, index) => {
    output[`bank_${bankOffset + stringBanks.length + index}.c`] = bankDataBank;
  });

  // console.log(output);

  return output;
};

//#region precompile

const precompile = async (projectData, projectRoot, progress) => {
  progress(EVENT_MSG_PRE_FLAGS);
  const flags = precompileFlags(projectData.scenes);

  progress(EVENT_MSG_PRE_STRINGS);
  const strings = precompileStrings(projectData.scenes);

  progress(EVENT_MSG_PRE_IMAGES);
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

  progress(EVENT_MSG_PRE_SPRITES);
  const { usedSprites, spriteLookup, spriteData } = await precompileSprites(
    projectData.spriteSheets,
    projectData.scenes,
    projectRoot
  );

  progress(EVENT_MSG_PRE_SCENES);
  const sceneData = precompileScenes(
    projectData.scenes,
    usedImages,
    usedSprites
  );

  progress(EVENT_MSG_PRE_COMPLETE);

  return {
    flags,
    strings,
    usedImages,
    imageLookup,
    usedTilesets,
    usedTilesetLookup,
    imageData,
    usedSprites,
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
      const data = await ggbgfx.imageToSpriteIntArray(
        `${projectRoot}/assets/sprites/${spriteSheet.filename}`
      );
      const size = data.length;
      const frames = size / 64;
      return {
        ...spriteSheet,
        data,
        size,
        frames
      };
    })
  );
  return {
    usedSprites: spriteData,
    spriteLookup
  };
};

export const precompileScenes = (scenes, usedImages, usedSprites) => {
  const scenesData = scenes.map(scene => {
    return {
      ...scene,
      imageIndex: usedImages.findIndex(image => image.id === scene.imageId),
      // tilemap: imageData.tilemaps[scene.imageId],
      // tileset: imageData.tilemapsTileset[scene.imageId],
      sprites: scene.actors.reduce((memo, actor) => {
        const spriteIndex = usedSprites.findIndex(
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

/*
export const compileActor = (actor, { eventsPtr, spriteSheetLookup }) => {
  // console.log("ACTOR", actor, eventsPtr);
  return [
    0, // Sprite sheet id // Should be an offset index from map sprites not overall sprites
    1, // Animated
    actor.x, // X Pos
    actor.y, // Y Pos
    dirDec(actor.direction), // Direction
    moveDec(actor.movementType), // Movement Type
    eventsPtr.bank, // Event bank ptr
    hi(eventsPtr.offset), // Event offset ptr
    lo(eventsPtr.offset)
  ];
};
*/

export const compileActors = (actors, { eventPtrs, sprites }) => {
  // console.log("ACTOR", actor, eventsPtr);
  let mapSpritesLookup = {};
  let mapSpritesIndex = 6;

  // console.log({ sprites, eventPtrs });

  const getSpriteOffset = id => {
    if (mapSpritesLookup[id]) {
      return mapSpritesLookup[id];
    }
    const lookup = mapSpritesIndex;
    mapSpritesLookup[id] = lookup;
    const sprite = sprites.find(s => s.id === id);
    mapSpritesIndex += sprite.size / 64;
    return lookup;
  };

  return flatten(
    actors.map((actor, actorIndex) => {
      return [
        getSpriteOffset(actor.spriteSheetId), // Sprite sheet id // Should be an offset index from map sprites not overall sprites
        sprites.find(s => s.id === actor.spriteSheetId).size / 64 === 6 // Animated
          ? 1
          : 0,
        actor.x, // X Pos
        actor.y, // Y Pos
        dirDec(actor.direction), // Direction
        moveDec(actor.movementType), // Movement Type
        eventPtrs[actorIndex].bank, // Event bank ptr
        hi(eventPtrs[actorIndex].offset), // Event offset ptr
        lo(eventPtrs[actorIndex].offset)
      ];
    })
  );
};

/*
export const compileTrigger = (trigger, { eventsPtr }) => {
  // console.log("TRIGGER", trigger, eventsPtr);
  return [
    trigger.x,
    trigger.y,
    trigger.width,
    trigger.height,
    trigger.trigger === "action" ? 1 : 0,
    eventsPtr.bank, // Event bank ptr
    hi(eventsPtr.offset), // Event offset ptr
    lo(eventsPtr.offset)
  ];
};
*/

export const compileTriggers = (triggers, { eventPtrs }) => {
  return flatten(
    triggers.map((trigger, triggerIndex) => {
      return [
        trigger.x,
        trigger.y,
        trigger.width,
        trigger.height,
        trigger.trigger === "action" ? 1 : 0,
        eventPtrs[triggerIndex].bank, // Event bank ptr
        hi(eventPtrs[triggerIndex].offset), // Event offset ptr
        lo(eventPtrs[triggerIndex].offset)
      ];
    })
  );
};

//#endregion

const DIR_LOOKUP = {
  down: 1,
  left: 2,
  right: 4,
  up: 8
};

const MOVEMENT_LOOKUP = {
  static: 1,
  playerInput: 2,
  randomFace: 3,
  faceInteraction: 4,
  randomWalk: 5
};

const dirDec = dir => DIR_LOOKUP[dir] || 1;

const moveDec = move => MOVEMENT_LOOKUP[move] || 1;

export default compile;
