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
export const EVENT_MSG_PRE_UI_IMAGES = "Preparing ui...";
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
    tmpPath = "/tmp",
    bankSize = GB_MAX_BANK_SIZE,
    bankOffset = MIN_DATA_BANK,
    stringsPerBank = STRINGS_PER_BANK,
    progress = () => {},
    warnings = () => {}
  } = {}
) => {
  const output = {};

  if (projectData.scenes.length === 0) {
    throw "No scenes are included in your project. Add some scenes in the Game World editor and try again.";
  }

  const precompiled = await precompile(projectData, projectRoot, tmpPath, {
    progress,
    warnings
  });

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
  const eventPtrs = precompiled.sceneData.map(scene => {
    const bankEntityEvents = entity => {
      const output = compileEntityEvents(entity.script, {
        scene,
        scenes: precompiled.sceneData,
        images: precompiled.usedImages,
        strings: precompiled.strings,
        flags: precompiled.flags
      });
      if (banked.dataWillFitCurrentBank(output)) {
        return banked.push(output);
      } else {
        const outputNewBank = compileEntityEvents(entity.script, {
          scene,
          scenes: precompiled.sceneData,
          strings: precompiled.strings,
          flags: precompiled.flags
        });
        return banked.push(output);
      }
    };
    return {
      start: bankEntityEvents(scene),
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

  // Add UI data
  const uiImagePtr = banked.push(precompiled.uiTiles);

  const emotesSpritePtr = banked.push(precompiled.emotesSprite);

  // Add sprite data
  const spritePtrs = precompiled.usedSprites.map(sprite => {
    return banked.push([].concat(sprite.frames, sprite.data));
  });

  // Add scene data
  const scenePtrs = precompiled.sceneData.map((scene, sceneIndex) => {
    const sceneImage = precompiled.usedImages[scene.imageIndex];
    const collisionsLength = Math.ceil(
      (sceneImage.width * sceneImage.height) / 8
    );
    return banked.push(
      [].concat(
        hi(scene.imageIndex),
        lo(scene.imageIndex),
        scene.sprites.length,
        scene.sprites,
        scene.actors.length,
        compileActors(scene.actors, {
          eventPtrs: eventPtrs[sceneIndex].actors,
          sprites: precompiled.usedSprites,
          scene
        }),
        scene.triggers.length,
        compileTriggers(scene.triggers, {
          eventPtrs: eventPtrs[sceneIndex].triggers
        }),
        collisionsLength,
        scene.collisions.slice(0, collisionsLength),
        eventPtrs[sceneIndex].start.bank, // Event bank ptr
        hi(eventPtrs[sceneIndex].start.offset), // Event offset ptr
        lo(eventPtrs[sceneIndex].start.offset)
      )
    );
  });

  let startSceneIndex = precompiled.sceneData.findIndex(
    m => m.id === projectData.settings.startSceneId
  );

  // If starting scene is not found just use first scene
  if (startSceneIndex < 0) {
    startSceneIndex = 0;
  }

  const { startX, startY, startDirection } = projectData.settings;
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

  const fixEmptyDataPtrs = ptrs => {
    if (ptrs.length === 0) {
      return [{ bank: 0, offset: 0 }];
    }
    return ptrs;
  };

  const dataPtrs = {
    tileset_bank_ptrs: fixEmptyDataPtrs(tileSetPtrs),
    image_bank_ptrs: fixEmptyDataPtrs(imagePtrs),
    sprite_bank_ptrs: fixEmptyDataPtrs(spritePtrs),
    scene_bank_ptrs: fixEmptyDataPtrs(scenePtrs)
  };

  const bankHeader = banked.exportCHeader(bankOffset);
  const bankData = banked.exportCData(bankOffset);

  // console.log(stringBanks.length);
  // console.log(
  //   stringBanks.map((bankStrings, index) => {
  //     return `extern const unsigned char strings_${bankOffset + index}[][38];`;
  //   })
  // );

  let playerSpriteIndex = precompiled.usedSprites.findIndex(
    s => s.id === projectData.settings.playerSpriteSheetId
  );
  if (playerSpriteIndex < 0) {
    playerSpriteIndex = precompiled.usedSprites.findIndex(
      s => s.type === "actor_animated"
    );
  }
  if (playerSpriteIndex < 0) {
    throw "Player sprite hasn't been set, add it from the Game World.";
  }

  const startDirectionValue = dirDec(startDirection);
  const startDirectionX =
    startDirectionValue == 2 ? -1 : startDirectionValue == 4 ? 1 : 0;
  const startDirectionY =
    startDirectionValue == 8 ? -1 : startDirectionValue == 1 ? 1 : 0;

  output[`data_ptrs.h`] =
    `#ifndef DATA_PTRS_H\n#define DATA_PTRS_H\n\n` +
    `typedef struct _BANK_PTR {\n` +
    `  unsigned char bank;\n` +
    `  unsigned int offset;\n` +
    `} BANK_PTR;\n\n` +
    `#define START_SCENE_INDEX ${decHex16(startSceneIndex)}\n` +
    `#define START_SCENE_X ${decHex(startX || 0)}\n` +
    `#define START_SCENE_Y ${decHex(startY || 0)}\n` +
    `#define START_SCENE_DIR_X ${startDirectionX}\n` +
    `#define START_SCENE_DIR_Y ${startDirectionY}\n` +
    `#define START_PLAYER_SPRITE ${playerSpriteIndex}\n` +
    `#define UI_BANK ${uiImagePtr.bank}\n` +
    `#define UI_BANK_OFFSET ${uiImagePtr.offset}\n` +
    `#define EMOTES_SPRITE_BANK ${emotesSpritePtr.bank}\n` +
    `#define EMOTES_SPRITE_BANK_OFFSET ${emotesSpritePtr.offset}\n` +
    `\n` +
    Object.keys(dataPtrs)
      .map(name => {
        return `extern const BANK_PTR ${name}[];`;
      })
      .join(`\n`) +
    `\n` +
    `extern const unsigned char (*bank_data_ptrs[])[];\n` +
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
    `const unsigned char (*bank_data_ptrs[])[] = {\n` +
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

const precompile = async (
  projectData,
  projectRoot,
  tmpPath,
  { progress, warnings }
) => {
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
    projectRoot,
    tmpPath,
    { warnings }
  );

  progress(EVENT_MSG_PRE_UI_IMAGES);
  const { uiTiles, emotesSprite } = await precompileUIImages(
    projectRoot,
    tmpPath,
    {
      warnings
    }
  );

  progress(EVENT_MSG_PRE_SPRITES);
  const { usedSprites, spriteLookup, spriteData } = await precompileSprites(
    projectData.spriteSheets,
    projectData.scenes,
    projectData.settings.playerSpriteSheetId,
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
    sceneData,
    uiTiles,
    emotesSprite
  };
};

export const precompileFlags = scenes => {
  let flags = [];
  walkScenesEvents(scenes, cmd => {
    if (cmd.args && cmd.args.hasOwnProperty("flag")) {
      const flag = cmd.args.flag || "0";
      if (flags.indexOf(flag) === -1) {
        flags.push(flag);
      }
    }
  });
  return flags;
};

export const precompileStrings = scenes => {
  let strings = [];
  walkScenesEvents(scenes, cmd => {
    if (cmd.args && cmd.args.text !== undefined) {
      const text = cmd.args.text || " "; // Replace empty strings with single space
      // If never seen this string before add it to the list
      if (strings.indexOf(text) === -1) {
        strings.push(text);
      }
    }
  });
  if (strings.length == 0) {
    return ["NOSTRINGS"];
  }
  return strings;
};

export const precompileImages = async (
  images,
  scenes,
  projectRoot,
  tmpPath,
  { warnings } = {}
) => {
  let eventImageIds = [];
  walkScenesEvents(scenes, cmd => {
    if (cmd.args && cmd.args.hasOwnProperty("imageId")) {
      eventImageIds.push(cmd.args.imageId);
    }
  });
  const usedImages = images.filter(
    image =>
      eventImageIds.indexOf(image.id) > -1 ||
      scenes.find(scene => scene.imageId === image.id)
  );
  const imageLookup = indexArray(usedImages, "id");
  const imageData = await compileImages(usedImages, projectRoot, tmpPath, {
    warnings
  });
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

export const precompileUIImages = async (
  projectRoot,
  tmpPath,
  { warnings }
) => {
  const uiPath = `${projectRoot}/assets/ui/ui.png`;
  const uiTiles = await ggbgfx.imageToTilesIntArray(uiPath);

  const emotesPath = `${projectRoot}/assets/ui/emotes.png`;
  const emotesSprite = await ggbgfx.imageToSpriteIntArray(emotesPath);

  return { uiTiles, emotesSprite };
};

export const precompileSprites = async (
  spriteSheets,
  scenes,
  playerSpriteSheetId,
  projectRoot
) => {
  const usedSprites = spriteSheets.filter(
    spriteSheet =>
      spriteSheet.id === playerSpriteSheetId ||
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
  const scenesData = scenes.map((scene, sceneIndex) => {
    const imageIndex = usedImages.findIndex(
      image => image.id === scene.imageId
    );
    if (imageIndex < 0) {
      throw "Scene #" +
        sceneIndex +
        " '" +
        scene.name +
        "' has missing or no image assigned.";
    }
    const actors = scene.actors.filter(actor => {
      return usedSprites.find(s => s.id === actor.spriteSheetId);
    });

    return {
      ...scene,
      imageIndex,
      actors,
      sprites: actors.reduce((memo, actor) => {
        const spriteIndex = usedSprites.findIndex(
          sprite => sprite.id === actor.spriteSheetId
        );
        if (memo.indexOf(spriteIndex) === -1) {
          memo.push(spriteIndex);
        }
        return memo;
      }, []),
      triggers: scene.triggers.filter(trigger => {
        // Filter out unused triggers which cause slow down
        // When walking over
        return trigger.script && trigger.script.length > 1;
      }),
      actorsData: [],
      triggersData: []
    };
  });
  return scenesData;
};

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

    if (!sprite) {
      return 0;
    }

    // console.log(sprites);
    mapSpritesIndex += sprite.size / 64;
    return lookup;
  };

  return flatten(
    actors.map((actor, actorIndex) => {
      const sprite = sprites.find(s => s.id === actor.spriteSheetId);
      if (!sprite) return [];
      const spriteFrames = sprite.size / 64;
      return [
        getSpriteOffset(actor.spriteSheetId), // Sprite sheet id // Should be an offset index from map sprites not overall sprites
        spriteFrames === 6
          ? 2 // Actor Animated
          : spriteFrames === 3
          ? 1 // Actor
          : 0, // Static
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

export const compileTriggers = (triggers, { eventPtrs }) => {
  return flatten(
    triggers.map((trigger, triggerIndex) => {
      return [
        trigger.x,
        trigger.y,
        Math.max(trigger.width, 1),
        Math.max(trigger.height, 1),
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
