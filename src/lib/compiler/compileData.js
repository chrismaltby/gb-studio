import { copy } from "fs-extra";
import uuid from "uuid/v4";
import BankedData, { MIN_DATA_BANK, GB_MAX_BANK_SIZE } from "./bankedData";
import {
  walkScenesEvents,
  findSceneEvent,
  walkEventsDepthFirst,
  eventHasArg
} from "../helpers/eventSystem";
import compileImages from "./compileImages";
import { indexBy, flatten } from "../helpers/array";
import ggbgfx from "./ggbgfx";
import { hi, lo, decHex16, decHex } from "../helpers/8bit";
import compileEntityEvents from "./compileEntityEvents";
import {
  EVENT_TEXT,
  EVENT_MUSIC_PLAY,
  EVENT_CHOICE,
  EVENT_SET_INPUT_SCRIPT,
  EVENT_END
} from "./eventTypes";
import { projectTemplatesRoot, MAX_ACTORS, MAX_TRIGGERS } from "../../consts";
import {
  combineMultipleChoiceText,
  dirDec,
  dirToXDec,
  dirToYDec,
  moveDec,
  moveSpeedDec,
  animSpeedDec,
  spriteTypeDec,
  actorFramesPerDir
} from "./helpers";
import { textNumLines } from "../helpers/trimlines";
import { assetFilename } from "../helpers/gbstudio";

const indexById = indexBy("id");

const DATA_PTRS_BANK = 5;
const NUM_MUSIC_BANKS = 8;

export const EVENT_START_DATA_COMPILE = "EVENT_START_DATA_COMPILE";
export const EVENT_DATA_COMPILE_PROGRESS = "EVENT_DATA_COMPILE_PROGRESS";
export const EVENT_END_DATA_COMPILE = "EVENT_END_DATA_COMPILE";

export const EVENT_MSG_PRE_VARIABLES = "Preparing variables...";
export const EVENT_MSG_PRE_STRINGS = "Preparing strings...";
export const EVENT_MSG_PRE_IMAGES = "Preparing images...";
export const EVENT_MSG_PRE_UI_IMAGES = "Preparing ui...";
export const EVENT_MSG_PRE_SPRITES = "Preparing sprites...";
export const EVENT_MSG_PRE_AVATARS = "Preparing avatars...";
export const EVENT_MSG_PRE_SCENES = "Preparing scenes...";
export const EVENT_MSG_PRE_EVENTS = "Preparing events...";
export const EVENT_MSG_PRE_MUSIC = "Preparing music...";
export const EVENT_MSG_PRE_COMPLETE = "Preparation complete";

const compile = async (
  projectData,
  {
    projectRoot = "/tmp",
    tmpPath = "/tmp",
    bankSize = GB_MAX_BANK_SIZE,
    bankOffset = MIN_DATA_BANK,
    progress = () => {},
    warnings = () => {}
  } = {}
) => {
  const output = {};

  if (projectData.scenes.length === 0) {
    throw new Error(
      "No scenes are included in your project. Add some scenes in the Game World editor and try again."
    );
  }

  const precompiled = await precompile(projectData, projectRoot, tmpPath, {
    progress,
    warnings
  });

  const banked = new BankedData({
    bankSize,
    bankOffset
  });

  // Add event data
  const eventPtrs = precompiled.sceneData.map((scene, sceneIndex) => {
    const subScripts = {};
    const bankEntitySubScripts = entityType => (entity, entityIndex) => {
      walkEventsDepthFirst(entity.script, cmd => {
        if (cmd.command === EVENT_SET_INPUT_SCRIPT) {
          subScripts[cmd.id] = banked.push(
            compileEntityEvents(cmd.true, {
              scene,
              sceneIndex,
              scenes: precompiled.sceneData,
              music: precompiled.usedMusic,
              sprites: precompiled.usedSprites,
              avatars: precompiled.usedAvatars,
              backgrounds: precompiled.usedBackgrounds,
              strings: precompiled.strings,
              variables: precompiled.variables,
              subScripts,
              entityType,
              entityIndex,
              entity,
              banked,
              warnings
            })
          );
        }
      });
    };

    bankEntitySubScripts("scene")(scene);
    scene.actors.map(bankEntitySubScripts("actor"));
    scene.triggers.map(bankEntitySubScripts("trigger"));

    const bankEntityEvents = entityType => (entity, entityIndex) => {
      return banked.push(
        compileEntityEvents(entity.script, {
          scene,
          sceneIndex,
          scenes: precompiled.sceneData,
          music: precompiled.usedMusic,
          sprites: precompiled.usedSprites,
          avatars: precompiled.usedAvatars,
          backgrounds: precompiled.usedBackgrounds,
          strings: precompiled.strings,
          variables: precompiled.variables,
          subScripts,
          entityType,
          entityIndex,
          entity,
          banked,
          warnings
        })
      );
    };
    return {
      start: bankEntityEvents("scene")(scene),
      actors: scene.actors.map(bankEntityEvents("actor")),
      triggers: scene.triggers.map(bankEntityEvents("trigger"))
    };
  });

  // Strings
  const stringPtrs = precompiled.strings.map(string => {
    const ascii = [];
    // Number of lines in string
    ascii.push(textNumLines(string));
    for (let i = 0; i < string.length; i++) {
      const char = string.charCodeAt(i);
      if (char < 256) {
        ascii.push(string.charCodeAt(i));
      }
    }
    ascii.push(0);
    return banked.push(ascii);
  });

  // Add tileset data
  const tileSetPtrs = precompiled.usedTilesets.map((tileset, tilesetIndex) => {
    return banked.push([].concat(Math.ceil(tileset.length / 16), tileset));
  });

  // Add background map data
  const backgroundPtrs = precompiled.usedBackgrounds.map(background => {
    return banked.push(
      [].concat(
        background.tilesetIndex,
        Math.floor(background.width),
        Math.floor(background.height),
        background.data
      )
    );
  });

  // Add UI data
  const fontImagePtr = banked.push(precompiled.fontTiles);
  const frameImagePtr = banked.push(precompiled.frameTiles);
  const cursorImagePtr = banked.push(precompiled.cursorTiles);
  const emotesSpritePtr = banked.push(precompiled.emotesSprite);
  
  // Add sprite data
  const spritePtrs = precompiled.usedSprites.map(sprite => {
    return banked.push([].concat(sprite.frames, sprite.data));
  });

  // Add avatar data
  const avatarPtrs = precompiled.usedAvatars.map(avatar => {
    return banked.push([].concat(avatar.frames, avatar.data));
  });
  
  // Add scene data
  const scenePtrs = precompiled.sceneData.map((scene, sceneIndex) => {
    const sceneImage = precompiled.usedBackgrounds[scene.backgroundIndex];
    const collisionsLength = Math.ceil(
      (sceneImage.width * sceneImage.height) / 8
    );
    const collisions = []
      .concat(scene.collisions, Array(collisionsLength).fill(0))
      .slice(0, collisionsLength);
    return banked.push(
      [].concat(
        hi(scene.backgroundIndex),
        lo(scene.backgroundIndex),
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
        collisions,
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

  const {
    startX,
    startY,
    startDirection,
    startMoveSpeed = "1",
    startAnimSpeed = "3"
  } = projectData.settings;

  const bankNums = [...Array(bankOffset + banked.data.length).keys()];

  const bankDataPtrs = bankNums.map(bankNum => {
    return bankNum >= bankOffset ? `&bank_${bankNum}_data` : 0;
  });

  const fixEmptyDataPtrs = ptrs => {
    if (ptrs.length === 0) {
      return [{ bank: 0, offset: 0 }];
    }
    return ptrs;
  };

  const dataPtrs = {
    tileset_bank_ptrs: fixEmptyDataPtrs(tileSetPtrs),
    background_bank_ptrs: fixEmptyDataPtrs(backgroundPtrs),
    sprite_bank_ptrs: fixEmptyDataPtrs(spritePtrs),
    scene_bank_ptrs: fixEmptyDataPtrs(scenePtrs),
    string_bank_ptrs: fixEmptyDataPtrs(stringPtrs),
    avatar_bank_ptrs: fixEmptyDataPtrs(avatarPtrs)
  };

  const bankHeader = banked.exportCHeader(bankOffset);
  const bankData = banked.exportCData(bankOffset);
  const nextAvailableBank = bankData.length + bankOffset + 1;

  const music = precompiled.usedMusic.map((track, index) => {
    return {
      ...track,
      bank: nextAvailableBank + (index % NUM_MUSIC_BANKS)
    };
  });

  let playerSpriteIndex = precompiled.usedSprites.findIndex(
    s => s.id === projectData.settings.playerSpriteSheetId
  );
  if (playerSpriteIndex < 0) {
    playerSpriteIndex = precompiled.usedSprites.findIndex(
      s => s.type === "actor_animated"
    );
  }
  if (playerSpriteIndex < 0) {
    throw new Error(
      "Player sprite hasn't been set, add it from the Game World."
    );
  }

  const startDirectionX = dirToXDec(startDirection);
  const startDirectionY = dirToYDec(startDirection);

  output[`data_ptrs.h`] =
    `${`#ifndef DATA_PTRS_H\n#define DATA_PTRS_H\n\n` +
      `typedef struct _BANK_PTR {\n` +
      `  unsigned char bank;\n` +
      `  unsigned int offset;\n` +
      `} BANK_PTR;\n\n` +
      `#define DATA_PTRS_BANK ${DATA_PTRS_BANK}\n` +
      `#define START_SCENE_INDEX ${decHex16(startSceneIndex)}\n` +
      `#define START_SCENE_X ${decHex(startX || 0)}\n` +
      `#define START_SCENE_Y ${decHex(startY || 0)}\n` +
      `#define START_SCENE_DIR_X ${startDirectionX}\n` +
      `#define START_SCENE_DIR_Y ${startDirectionY}\n` +
      `#define START_PLAYER_SPRITE ${playerSpriteIndex}\n` +
      `#define START_PLAYER_MOVE_SPEED ${moveSpeedDec(startMoveSpeed)}\n` +
      `#define START_PLAYER_ANIM_SPEED ${animSpeedDec(startAnimSpeed)}\n` +
      `#define FONT_BANK ${fontImagePtr.bank}\n` +
      `#define FONT_BANK_OFFSET ${fontImagePtr.offset}\n` +
      `#define FRAME_BANK ${frameImagePtr.bank}\n` +
      `#define FRAME_BANK_OFFSET ${frameImagePtr.offset}\n` +
      `#define CURSOR_BANK ${cursorImagePtr.bank}\n` +
      `#define CURSOR_BANK_OFFSET ${cursorImagePtr.offset}\n` +
      `#define EMOTES_SPRITE_BANK ${emotesSpritePtr.bank}\n` +
      `#define EMOTES_SPRITE_BANK_OFFSET ${emotesSpritePtr.offset}\n` +
      `#define NUM_VARIABLES ${precompiled.variables.length}\n` +
      `\n`}${Object.keys(dataPtrs)
      .map(name => {
        return `extern const BANK_PTR ${name}[];`;
      })
      .join(`\n`)}\n` +
    `extern const unsigned char (*bank_data_ptrs[])[];\n` +
    `extern const unsigned char * music_tracks[];\n` +
    `extern const unsigned char music_banks[];\n` +
    `extern unsigned char script_variables[${precompiled.variables.length +
      1}];\n${music
      .map((track, index) => {
        return `extern const unsigned char * ${track.dataName}_Data[];`;
      })
      .join(`\n`)}\n\n#endif\n`;
  output[`data_ptrs.c`] =
    `${`#pragma bank=${DATA_PTRS_BANK}\n` +
      `#include "data_ptrs.h"\n` +
      `#include "banks.h"\n\n` +
      `const unsigned char (*bank_data_ptrs[])[] = {\n`}${bankDataPtrs.join(
      ","
    )}\n};\n\n${Object.keys(dataPtrs)
      .map(name => {
        return `const BANK_PTR ${name}[] = {\n${dataPtrs[name]
          .map(dataPtr => {
            return `{${decHex(dataPtr.bank)},${decHex16(dataPtr.offset)}}`;
          })
          .join(",")}\n};\n`;
      })
      .join(`\n`)}\n` +
    `const unsigned char * music_tracks[] = {\n${music
      .map(track => `${track.dataName}_Data`)
      .join(", ") || "0"}, 0` +
    `\n};\n\n` +
    `const unsigned char music_banks[] = {\n${music
      .map(track => track.bank)
      .join(", ") || "0"}, 0` +
    `\n};\n\n` +
    `unsigned char script_variables[${precompiled.variables.length +
      1}] = { 0 };\n`;

  output[`banks.h`] = bankHeader;

  bankData.forEach((bankDataBank, index) => {
    output[`bank_${bankOffset + index}.c`] = bankDataBank;
  });

  return {
    files: output,
    music
  };
};

// #region precompile

const precompile = async (
  projectData,
  projectRoot,
  tmpPath,
  { progress, warnings }
) => {
  progress(EVENT_MSG_PRE_VARIABLES);
  const variables = precompileVariables(projectData.scenes);

  progress(EVENT_MSG_PRE_STRINGS);
  const strings = precompileStrings(projectData.scenes);

  progress(EVENT_MSG_PRE_IMAGES);
  const {
    usedBackgrounds,
    backgroundLookup,
    backgroundData,
    usedTilesets,
    usedTilesetLookup
  } = await precompileBackgrounds(
    projectData.backgrounds,
    projectData.scenes,
    projectRoot,
    tmpPath,
    { warnings }
  );

  progress(EVENT_MSG_PRE_UI_IMAGES);
  const {
    emotesSprite,
    fontTiles,
    frameTiles,
    cursorTiles
  } = await precompileUIImages(projectRoot, tmpPath, {
    warnings
  });

  progress(EVENT_MSG_PRE_SPRITES);
  const { usedSprites } = await precompileSprites(
    projectData.spriteSheets,
    projectData.scenes,
    projectData.settings.playerSpriteSheetId,
    projectRoot,
    {
      warnings
    }
  );

  progress(EVENT_MSG_PRE_AVATARS);
  const { usedAvatars } = await precompileAvatars(
    projectData.spriteSheets,
    projectData.scenes,
    projectRoot,
    {
      warnings
    }
  );

  progress(EVENT_MSG_PRE_MUSIC);
  const { usedMusic } = await precompileMusic(
    projectData.scenes,
    projectData.music
  );

  progress(EVENT_MSG_PRE_SCENES);
  const sceneData = precompileScenes(
    projectData.scenes,
    usedBackgrounds,
    usedSprites,
    {
      warnings
    }
  );

  progress(EVENT_MSG_PRE_COMPLETE);

  return {
    variables,
    strings,
    usedBackgrounds,
    backgroundLookup,
    usedTilesets,
    usedTilesetLookup,
    backgroundData,
    usedSprites,
    usedMusic,
    sceneData,
    fontTiles,
    frameTiles,
    cursorTiles,
    emotesSprite,
    usedAvatars
  };
};

export const precompileVariables = scenes => {
  const variables = [];
  for (let i = 0; i <= 99; i++) {
    variables.push(String(i));
  }
  walkScenesEvents(scenes, cmd => {
    if (eventHasArg(cmd, "variable")) {
      const variable = cmd.args.variable || "0";
      if (variables.indexOf(variable) === -1) {
        variables.push(variable);
      }
    }
    if (eventHasArg(cmd, "vectorX")) {
      const x = cmd.args.vectorX || "0";
      if (variables.indexOf(x) === -1) {
        variables.push(x);
      }
    }
    if (eventHasArg(cmd, "vectorY")) {
      const y = cmd.args.vectorY || "0";
      if (variables.indexOf(y) === -1) {
        variables.push(y);
      }
    }
  });
  variables.push("tmp1");
  variables.push("tmp2");
  return variables;
};

export const precompileStrings = scenes => {
  const strings = [];
  walkScenesEvents(scenes, cmd => {
    if (
      cmd.args &&
      (cmd.args.text !== undefined || cmd.command === EVENT_TEXT)
    ) {
      const text = cmd.args.text || " "; // Replace empty strings with single space
      // If never seen this string before add it to the list
      if (Array.isArray(text)) {
        for (let i = 0; i < text.length; i++) {
          const rowText = text[i] || " ";
          if (strings.indexOf(rowText) === -1) {
            strings.push(rowText);
          }
        }
      } else if (strings.indexOf(text) === -1) {
        strings.push(text);
      }
    } else if (cmd.command === EVENT_CHOICE) {
      const text = combineMultipleChoiceText(cmd.args);
      if (strings.indexOf(text) === -1) {
        strings.push(text);
      }
    }
  });
  if (strings.length === 0) {
    return ["NOSTRINGS"];
  }
  return strings;
};

export const precompileBackgrounds = async (
  backgrounds,
  scenes,
  projectRoot,
  tmpPath,
  { warnings } = {}
) => {
  const eventImageIds = [];
  walkScenesEvents(scenes, cmd => {
    if (eventHasArg(cmd, "backgroundId")) {
      eventImageIds.push(cmd.args.backgroundId);
    }
  });
  const usedBackgrounds = backgrounds.filter(
    background =>
      eventImageIds.indexOf(background.id) > -1 ||
      scenes.find(scene => scene.backgroundId === background.id)
  );
  const backgroundLookup = indexById(usedBackgrounds);
  const backgroundData = await compileImages(
    usedBackgrounds,
    projectRoot,
    tmpPath,
    {
      warnings
    }
  );
  const usedTilesets = [];
  const usedTilesetLookup = {};
  Object.keys(backgroundData.tilesets).forEach(tileKey => {
    usedTilesetLookup[tileKey] = usedTilesets.length;
    usedTilesets.push(backgroundData.tilesets[tileKey]);
  });
  const usedBackgroundsWithData = usedBackgrounds.map(background => {
    if (
      background.imageWidth / 8 !== background.width ||
      background.imageHeight / 8 !== background.height
    ) {
      warnings(
        `Background '${
          background.filename
        }' has invalid dimensions and may not appear correctly. Width and height must be multiples of 8px and no larger than 256px.`
      );
    }
    return {
      ...background,
      tilesetIndex:
        usedTilesetLookup[backgroundData.tilemapsTileset[background.id]],
      data: backgroundData.tilemaps[background.id]
    };
  });
  return {
    usedBackgrounds: usedBackgroundsWithData,
    usedTilesets,
    // usedTilesetLookup,
    backgroundLookup
    // backgroundData
  };
};

export const precompileUIImages = async (
  projectRoot,
  tmpPath,
  { warnings }
) => {
  const fontPath = await ensureProjectAsset("assets/ui/ascii.png", {
    projectRoot,
    warnings
  });
  const framePath = await ensureProjectAsset("assets/ui/frame.png", {
    projectRoot,
    warnings
  });
  const emotesPath = await ensureProjectAsset("assets/ui/emotes.png", {
    projectRoot,
    warnings
  });
  const cursorPath = await ensureProjectAsset("assets/ui/cursor.png", {
    projectRoot,
    warnings
  });

  const frameTiles = await ggbgfx.imageToTilesDataIntArray(framePath);
  const fontTiles = await ggbgfx.imageToTilesDataIntArray(fontPath);
  const cursorTiles = await ggbgfx.imageToTilesDataIntArray(cursorPath);
  const emotesSprite = await ggbgfx.imageToSpriteIntArray(emotesPath);

  return { emotesSprite, frameTiles, fontTiles, cursorTiles };
};

export const precompileSprites = async (
  spriteSheets,
  scenes,
  playerSpriteSheetId,
  projectRoot,
  { warnings } = {}
) => {
  const usedSprites = spriteSheets.filter(
    spriteSheet =>
      spriteSheet.id === playerSpriteSheetId ||
      scenes.find(
        scene =>
          scene.actors.find(actor => actor.spriteSheetId === spriteSheet.id) ||
          findSceneEvent(scene, event => {
            return event.args && event.args.spriteSheetId === spriteSheet.id;
          })
      )
  );

  const spriteLookup = indexById(usedSprites);
  const spriteData = await Promise.all(
    usedSprites.map(async spriteSheet => {
      const data = await ggbgfx.imageToSpriteIntArray(
        assetFilename(projectRoot, "sprites", spriteSheet)
      );
      const size = data.length;
      const frames = Math.ceil(size / 64);
      if (Math.ceil(size / 64) !== Math.floor(size / 64)) {
        warnings(
          `Sprite '${
            spriteSheet.filename
          }' has invalid dimensions and may not appear correctly. Must be 16px tall and a multiple of 16px wide.`
        );
      }

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

export const precompileAvatars = async (
  spriteSheets,
  scenes,
  projectRoot,
  { warnings } = {}
) => {
  const usedAvatars = spriteSheets.filter(
    spriteSheet =>
      scenes.find(
        scene =>
          findSceneEvent(scene, event => {
            return event.args && event.args.avatarId === spriteSheet.id;
          })
      )
  );

  const avatarLookup = indexById(usedAvatars);
  const avatarData = await Promise.all(
    usedAvatars.map(async spriteSheet => {
      const data = await ggbgfx.imageToTilesDataIntArray(
        assetFilename(projectRoot, "sprites", spriteSheet)
      );
      const size = data.length;
      const frames = Math.ceil(size / 64);
      if (Math.ceil(size / 64) !== Math.floor(size / 64)) {
        warnings(
          `Sprite '${
            spriteSheet.filename
          }' has invalid dimensions and may not appear correctly. Must be 16px tall and a multiple of 16px wide.`
        );
      }

      return {
        ...spriteSheet,
        data,
        size,
        frames
      };
    })
  );
  return {
    usedAvatars: avatarData,
    avatarLookup
  };
}

export const precompileMusic = (scenes, music) => {
  const usedMusicIds = [];
  walkScenesEvents(scenes, cmd => {
    if (
      cmd.args &&
      (cmd.args.musicId !== undefined || cmd.command === EVENT_MUSIC_PLAY)
    ) {
      const musicId = cmd.args.musicId || music[0].id;
      // If never seen this track before add it to the list
      if (usedMusicIds.indexOf(musicId) === -1) {
        usedMusicIds.push(musicId);
      }
    }
  });
  const usedMusic = music
    .filter(track => {
      return usedMusicIds.indexOf(track.id) > -1;
    })
    .map((track, index) => {
      return {
        ...track,
        dataName: `music_${uuid().replace(/-.*/, "")}${index}`
      };
    });
  return { usedMusic };
};

export const precompileScenes = (
  scenes,
  usedBackgrounds,
  usedSprites,
  { warnings } = {}
) => {
  const scenesData = scenes.map((scene, sceneIndex) => {
    const backgroundIndex = usedBackgrounds.findIndex(
      background => background.id === scene.backgroundId
    );
    if (backgroundIndex < 0) {
      throw new Error(
        `Scene #${sceneIndex + 1} ${
          scene.name ? `'${scene.name}'` : ""
        } has missing or no background assigned.`
      );
    }

    if (scene.actors.length > MAX_ACTORS) {
      warnings(
        `Scene #${sceneIndex + 1} ${
          scene.name ? `'${scene.name}'` : ""
        } contains ${
          scene.actors.length
        } actors when maximum is ${MAX_ACTORS}. Some actors will be removed.`
      );
    }

    if (scene.triggers.length > MAX_TRIGGERS) {
      warnings(
        `Scene #${sceneIndex + 1} ${
          scene.name ? `'${scene.name}'` : ""
        } contains ${
          scene.triggers.length
        } triggers when maximum is ${MAX_TRIGGERS}. Some triggers will be removed.`
      );
    }

    const actors = scene.actors.slice(0, MAX_ACTORS).filter(actor => {
      return usedSprites.find(s => s.id === actor.spriteSheetId);
    });

    return {
      ...scene,
      backgroundIndex,
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
      triggers: scene.triggers.slice(0, MAX_TRIGGERS).filter(trigger => {
        // Filter out unused triggers which cause slow down
        // When walking over
        return (
          trigger.script &&
          trigger.script.length >= 1 &&
          trigger.script[0].command !== EVENT_END
        );
      }),
      actorsData: [],
      triggersData: []
    };
  });
  return scenesData;
};

export const compileActors = (actors, { eventPtrs, sprites }) => {
  // console.log("ACTOR", actor, eventsPtr);
  const mapSpritesLookup = {};
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
      const spriteFrames = sprite.frames;
      const actorFrames = actorFramesPerDir(actor.movementType, spriteFrames);
      const initialFrame =
        moveDec(actor.movementType) === 1 ? actor.frame % actorFrames : 0;
      return [
        getSpriteOffset(actor.spriteSheetId), // Sprite sheet id // Should be an offset index from map sprites not overall sprites
        spriteTypeDec(actor.movementType, spriteFrames), // Sprite Type
        actorFrames, // Frames per direction
        (actor.animate ? 1 : 0) + (initialFrame << 1),
        actor.x, // X Pos
        actor.y, // Y Pos
        dirDec(actor.direction), // Direction
        moveDec(actor.movementType), // Movement Type
        moveSpeedDec(actor.moveSpeed),
        animSpeedDec(actor.animSpeed),
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

// #endregion

const ensureProjectAsset = async (relativePath, { projectRoot, warnings }) => {
  const projectPath = `${projectRoot}/${relativePath}`;
  const defaultPath = `${projectTemplatesRoot}/gbhtml/${relativePath}`;
  try {
    await copy(defaultPath, projectPath, {
      overwrite: false,
      errorOnExist: true
    });
    warnings(
      `${relativePath} was missing, copying default file to project assets`
    );
  } catch (e) {
    // Don't need to catch this, if it failed then the file already exists
    // and we can safely continue.
  }
  return projectPath;
};

export default compile;
