import keyBy from "lodash/keyBy";
import { eventHasArg } from "../helpers/eventSystem";
import compileImages from "./compileImages";
import { indexBy } from "../helpers/array";
import compileEntityEvents from "./compileEntityEvents";
import {
  EVENT_TEXT,
  EVENT_MUSIC_PLAY,
  EVENT_END,
  EVENT_PLAYER_SET_SPRITE,
  EVENT_ACTOR_SET_SPRITE,
} from "./eventTypes";
import {
  projectTemplatesRoot,
  MAX_ACTORS,
  MAX_TRIGGERS,
  DMG_PALETTE,
  MAX_NESTED_SCRIPT_DEPTH,
} from "../../consts";
import compileSprites from "./compileSprites";
import compileAvatars from "./compileAvatars";
import compileEmotes from "./compileEmotes";
import compileFonts from "./compileFonts";
import { precompileEngineFields } from "../helpers/engineFields";
import {
  compileBackground,
  compileBackgroundHeader,
  compileTilemap,
  compileTilemapHeader,
  compileTilemapAttr,
  compileTilemapAttrHeader,
  compileScene,
  compileSceneActors,
  compileSceneActorsHeader,
  compileSceneHeader,
  compileSceneTriggers,
  compileSceneTriggersHeader,
  compileSceneSprites,
  compileSceneSpritesHeader,
  compileSceneCollisions,
  compileSceneCollisionsHeader,
  compileSpriteSheet,
  compileSpriteSheetHeader,
  compileTileset,
  compileTilesetHeader,
  paletteSymbol,
  compilePalette,
  compilePaletteHeader,
  compileFont,
  compileFontHeader,
  compileFrameImage,
  compileFrameImageHeader,
  compileCursorImage,
  compileCursorImageHeader,
  compileScriptHeader,
  compileGameGlobalsInclude,
  compileAvatarFontHeader,
  compileAvatarFont,
  compileEmoteHeader,
  compileEmote,
  compileSceneProjectiles,
  compileSceneProjectilesHeader,
  spriteSheetSymbol,
  compileSaveSignature,
} from "./compileData2";
import compileSGBImage from "./sgb";
import { readFileToTilesData } from "../tiles/tileData";
import l10n from "../helpers/l10n";
import { compileScriptEngineInit } from "./compileBootstrap";
import { compileMusicTracks, compileMusicHeader } from "./compileMusic";
import { chunk } from "../helpers/array2";
import { toProjectileHash } from "./scriptBuilder";
import {
  walkDenormalizedSceneEvents,
  walkDenormalizedScenesEvents,
} from "lib/helpers/eventHelpers";
import copy from "lib/helpers/fsCopy";
import { ensureDir } from "fs-extra";
import Path from "path";

const indexById = indexBy("id");

export const EVENT_START_DATA_COMPILE = "EVENT_START_DATA_COMPILE";
export const EVENT_DATA_COMPILE_PROGRESS = "EVENT_DATA_COMPILE_PROGRESS";
export const EVENT_END_DATA_COMPILE = "EVENT_END_DATA_COMPILE";

export const EVENT_MSG_PRE_VARIABLES = "Preparing variables...";
export const EVENT_MSG_PRE_STRINGS = "Preparing strings...";
export const EVENT_MSG_PRE_IMAGES = "Preparing images...";
export const EVENT_MSG_PRE_UI_IMAGES = "Preparing ui...";
export const EVENT_MSG_PRE_SPRITES = "Preparing sprites...";
export const EVENT_MSG_PRE_AVATARS = "Preparing avatars...";
export const EVENT_MSG_PRE_EMOTES = "Preparing emotes...";
export const EVENT_MSG_PRE_SCENES = "Preparing scenes...";
export const EVENT_MSG_PRE_EVENTS = "Preparing events...";
export const EVENT_MSG_PRE_MUSIC = "Preparing music...";
export const EVENT_MSG_PRE_FONTS = "Preparing fonts...";

export const EVENT_MSG_PRE_COMPLETE = "Preparation complete";
export const EVENT_MSG_COMPILING_EVENTS = "Compiling events...";

const padArrayEnd = (arr, len, padding) => {
  if (arr.length > len) {
    return arr.slice(0, len);
  }
  return arr.concat(Array(len - arr.length).fill(padding));
};

const ensureProjectAsset = async (relativePath, { projectRoot, warnings }) => {
  const projectPath = `${projectRoot}/${relativePath}`;
  const defaultPath = `${projectTemplatesRoot}/gbhtml/${relativePath}`;
  try {
    await ensureDir(Path.dirname(projectPath));
    await copy(defaultPath, projectPath, {
      overwrite: false,
      errorOnExist: true,
    });
    warnings &&
      warnings(
        `${relativePath} was missing, copying default file to project assets`
      );
  } catch (e) {
    // Don't need to catch this, if it failed then the file already exists
    // and we can safely continue.
  }
  return `${projectPath}`;
};

// #region precompile

export const precompileStrings = (scenes, customEventsLookup) => {
  const strings = [];
  walkDenormalizedScenesEvents(
    scenes,
    {
      customEventsLookup,
      maxDepth: MAX_NESTED_SCRIPT_DEPTH,
    },
    (cmd) => {
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
      }
    }
  );
  if (strings.length === 0) {
    return ["NOSTRINGS"];
  }
  return strings;
};

export const precompileBackgrounds = async (
  backgrounds,
  scenes,
  customEventsLookup,
  projectRoot,
  tmpPath,
  { warnings } = {}
) => {
  const usedTilemaps = [];
  const usedTilemapAttrs = [];
  const usedTilemapsCache = {};
  const usedTilemapAttrsCache = {};

  const eventImageIds = [];
  walkDenormalizedScenesEvents(
    scenes,
    {
      customEventsLookup,
      maxDepth: MAX_NESTED_SCRIPT_DEPTH,
    },
    (cmd) => {
      if (eventHasArg(cmd, "backgroundId")) {
        eventImageIds.push(cmd.args.backgroundId);
      }
    }
  );
  const usedBackgrounds = backgrounds.filter(
    (background) =>
      eventImageIds.indexOf(background.id) > -1 ||
      scenes.find((scene) => scene.backgroundId === background.id)
  );

  // List of ids to generate 360 tiles
  const generate360Ids = usedBackgrounds
    .filter((background) =>
      scenes.find(
        (scene) => scene.backgroundId === background.id && scene.type === "LOGO"
      )
    )
    .map((background) => background.id);

  const backgroundLookup = indexById(usedBackgrounds);
  const backgroundData = await compileImages(
    usedBackgrounds,
    generate360Ids,
    projectRoot,
    tmpPath,
    {
      warnings,
    }
  );

  const usedTilesets = [];
  const usedTilesetLookup = {};
  Object.keys(backgroundData.tilesets).forEach((tileKey) => {
    usedTilesetLookup[tileKey] = usedTilesets.length;
    usedTilesets.push(backgroundData.tilesets[tileKey]);
  });

  const usedBackgroundsWithData = usedBackgrounds.map((background) => {
    // Determine tilemap
    const tilemap = backgroundData.tilemaps[background.id];
    const tilemapKey = JSON.stringify(tilemap);
    let tilemapIndex = 0;
    if (usedTilemapsCache[tilemapKey] === undefined) {
      // New tilemap
      tilemapIndex = usedTilemaps.length;
      usedTilemaps.push(tilemap);
      usedTilemapsCache[tilemapKey] = tilemapIndex;
    } else {
      // Already used tilemap
      tilemapIndex = usedTilemapsCache[tilemapKey];
    }

    // Determine tilemap attrs
    const tilemapAttr = padArrayEnd(
      background.tileColors || [],
      tilemap.length,
      0
    );
    const tilemapAttrKey = JSON.stringify(tilemapAttr);
    let tilemapAttrIndex = 0;
    if (usedTilemapAttrsCache[tilemapAttrKey] === undefined) {
      // New tilemap attr
      tilemapAttrIndex = usedTilemapAttrs.length;
      usedTilemapAttrs.push(tilemapAttr);
      usedTilemapAttrsCache[tilemapAttrKey] = tilemapAttrIndex;
    } else {
      // Already used tilemap attr
      tilemapAttrIndex = usedTilemapAttrsCache[tilemapAttrKey];
    }

    return {
      ...background,
      tilesetIndex:
        usedTilesetLookup[backgroundData.tilemapsTileset[background.id]],
      tilemapIndex,
      tilemapAttrIndex,
      data: tilemap,
    };
  });

  return {
    usedBackgrounds: usedBackgroundsWithData,
    usedTilesets,
    backgroundLookup,
    usedTilemaps,
    usedTilemapAttrs,
  };
};

export const precompilePalettes = async (scenes, settings, palettes) => {
  const usedPalettes = [];
  const usedPalettesCache = {};
  const scenePaletteIndexes = {};
  const sceneActorPaletteIndexes = {};
  const eventPaletteIndexes = {};
  const actorPaletteIndexes = {};

  const isColor = settings.customColorsEnabled || settings.sgbEnabled;

  const palettesLookup = indexById(palettes);
  const defaultBackgroundPaletteIds =
    settings.defaultBackgroundPaletteIds || [];
  const defaultSpritePaletteIds = settings.defaultSpritePaletteIds || [];

  const getPalette = (id, fallbackId) => {
    if (id === "dmg") {
      return DMG_PALETTE;
    }
    return palettesLookup[id] || palettesLookup[fallbackId] || DMG_PALETTE;
  };

  const getSpritePalette = (id, fallbackId) => {
    const p = getPalette(id, fallbackId);
    return {
      ...p,
      colors: [p.colors[0], p.colors[0], p.colors[1], p.colors[3]],
    };
  };

  // Background palettes

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const sceneBackgroundPaletteIds = scene.paletteIds || [];

    const scenePalette = {
      dmg: [["DMG_WHITE", "DMG_LITE_GRAY", "DMG_DARK_GRAY", "DMG_BLACK"]],
      colors:
        isColor &&
        [
          getPalette(
            sceneBackgroundPaletteIds[0],
            defaultBackgroundPaletteIds[0]
          ),
          getPalette(
            sceneBackgroundPaletteIds[1],
            defaultBackgroundPaletteIds[1]
          ),
          getPalette(
            sceneBackgroundPaletteIds[2],
            defaultBackgroundPaletteIds[2]
          ),
          getPalette(
            sceneBackgroundPaletteIds[3],
            defaultBackgroundPaletteIds[3]
          ),
          getPalette(
            sceneBackgroundPaletteIds[4],
            defaultBackgroundPaletteIds[4]
          ),
          getPalette(
            sceneBackgroundPaletteIds[5],
            defaultBackgroundPaletteIds[5]
          ),
          getPalette(
            sceneBackgroundPaletteIds[6],
            defaultBackgroundPaletteIds[6]
          ),
          getPalette(
            sceneBackgroundPaletteIds[7],
            defaultBackgroundPaletteIds[7]
          ),
        ].map((p) => p.colors),
    };

    const scenePaletteKey = JSON.stringify(scenePalette);
    if (usedPalettesCache[scenePaletteKey] === undefined) {
      // New palette
      const paletteIndex = usedPalettes.length;
      usedPalettes.push(scenePalette);
      usedPalettesCache[scenePaletteKey] = paletteIndex;
      scenePaletteIndexes[scene.id] = paletteIndex;
    } else {
      // Already used palette
      scenePaletteIndexes[scene.id] = usedPalettesCache[scenePaletteKey];
    }
  }

  // Actor palettes

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const sceneSpritePaletteIds = scene.spritePaletteIds || [];

    const actorsPalette = {
      dmg: [
        ["DMG_WHITE", "DMG_WHITE", "DMG_LITE_GRAY", "DMG_BLACK"],
        ["DMG_WHITE", "DMG_WHITE", "DMG_DARK_GRAY", "DMG_BLACK"],
      ],
      colors:
        isColor &&
        [
          getSpritePalette(
            sceneSpritePaletteIds[0],
            defaultSpritePaletteIds[0]
          ),
          getSpritePalette(
            sceneSpritePaletteIds[1],
            defaultSpritePaletteIds[1]
          ),
          getSpritePalette(
            sceneSpritePaletteIds[2],
            defaultSpritePaletteIds[2]
          ),
          getSpritePalette(
            sceneSpritePaletteIds[3],
            defaultSpritePaletteIds[3]
          ),
          getSpritePalette(
            sceneSpritePaletteIds[4],
            defaultSpritePaletteIds[4]
          ),
          getSpritePalette(
            sceneSpritePaletteIds[5],
            defaultSpritePaletteIds[5]
          ),
          getSpritePalette(
            sceneSpritePaletteIds[6],
            defaultSpritePaletteIds[6]
          ),
          getSpritePalette(
            sceneSpritePaletteIds[7],
            defaultSpritePaletteIds[7]
          ),
        ].map((p) => p.colors),
    };

    const actorsPaletteKey = JSON.stringify(actorsPalette);
    if (usedPalettesCache[actorsPaletteKey] === undefined) {
      // New palette
      const paletteIndex = usedPalettes.length;
      usedPalettes.push(actorsPalette);
      usedPalettesCache[actorsPaletteKey] = paletteIndex;
      sceneActorPaletteIndexes[scene.id] = paletteIndex;
    } else {
      // Already used palette
      sceneActorPaletteIndexes[scene.id] = usedPalettesCache[actorsPaletteKey];
    }
  }

  return {
    usedPalettes,
    scenePaletteIndexes,
    sceneActorPaletteIndexes,
    actorPaletteIndexes,
    eventPaletteIndexes,
  };
};

export const precompileUIImages = async (
  projectRoot,
  tmpPath,
  { warnings }
) => {
  const framePath = await ensureProjectAsset("assets/ui/frame.png", {
    projectRoot,
    warnings,
  });
  const cursorPath = await ensureProjectAsset("assets/ui/cursor.png", {
    projectRoot,
    warnings,
  });

  const frameTiles = await readFileToTilesData(framePath);
  const cursorTiles = await readFileToTilesData(cursorPath);

  return { frameTiles, cursorTiles };
};

export const precompileSprites = async (
  spriteSheets,
  scenes,
  customEventsLookup,
  defaultPlayerSprites,
  projectRoot,
  usedTilesets,
  { warnings } = {}
) => {
  const usedSprites = [];
  const usedSpriteLookup = {};
  const spriteLookup = indexById(spriteSheets);

  const addSprite = (spriteSheetId) => {
    if (!usedSpriteLookup[spriteSheetId] && spriteLookup[spriteSheetId]) {
      const spriteSheet = spriteLookup[spriteSheetId];
      usedSprites.push(spriteSheet);
      usedSpriteLookup[spriteSheetId] = spriteSheet;
    }
  };

  walkDenormalizedScenesEvents(
    scenes,
    {
      customEventsLookup,
      maxDepth: MAX_NESTED_SCRIPT_DEPTH,
    },
    (event) => {
      if (event.args) {
        if (event.args.spriteSheetId) {
          addSprite(event.args.spriteSheetId);
        }
      }
    }
  );

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    addSprite(scene.playerSpriteSheetId);
    addSprite(defaultPlayerSprites[scene.type]);
    for (let a = 0; a < scene.actors.length; a++) {
      const actor = scene.actors[a];
      addSprite(actor.spriteSheetId);
    }
  }

  const { spritesData, statesOrder, stateReferences } = await compileSprites(
    usedSprites,
    projectRoot,
    {
      warnings,
    }
  );

  // Build tilemap cache
  const usedTilesetCache = {};
  usedTilesets.forEach((tileset, tilesetIndex) => {
    usedTilesetCache[JSON.stringify(tileset)] = tilesetIndex;
  });

  const usedSpritesWithData = spritesData.map((sprite) => {
    // Determine tileset
    const tileset = sprite.data;
    const tilesetKey = JSON.stringify(tileset);
    let tilesetIndex = 0;
    if (usedTilesetCache[tilesetKey] === undefined) {
      // New tileset
      tilesetIndex = usedTilesets.length;
      usedTilesets.push(tileset);
      usedTilesetCache[tilesetKey] = tilesetIndex;
    } else {
      // Already used tileset
      tilesetIndex = usedTilesetCache[tilesetKey];
    }

    return {
      ...sprite,
      tilesetIndex,
    };
  });

  return {
    usedSprites: usedSpritesWithData,
    statesOrder,
    stateReferences,
    spriteLookup,
  };
};

export const precompileAvatars = async (
  avatars,
  scenes,
  customEventsLookup,
  projectRoot,
  { warnings } = {}
) => {
  const usedAvatars = [];
  const usedAvatarLookup = {};
  const avatarLookup = indexById(avatars);

  walkDenormalizedScenesEvents(
    scenes,
    {
      customEventsLookup,
      maxDepth: MAX_NESTED_SCRIPT_DEPTH,
    },
    (event) => {
      if (event.args) {
        if (
          event.args.avatarId &&
          !usedAvatarLookup[event.args.avatarId] &&
          avatarLookup[event.args.avatarId]
        ) {
          const avatar = avatarLookup[event.args.avatarId];
          usedAvatars.push(avatar);
          usedAvatarLookup[event.args.avatarId] = avatar;
        }
      }
    }
  );

  const avatarData = await compileAvatars(usedAvatars, projectRoot, {
    warnings,
  });

  return {
    usedAvatars: avatarData,
    avatarLookup,
  };
};

export const precompileEmotes = async (
  emotes,
  scenes,
  customEventsLookup,
  projectRoot,
  { warnings } = {}
) => {
  const usedEmotes = [];
  const usedEmoteLookup = {};
  const emoteLookup = indexById(emotes);

  walkDenormalizedScenesEvents(
    scenes,
    {
      customEventsLookup,
      maxDepth: MAX_NESTED_SCRIPT_DEPTH,
    },
    (event) => {
      if (event.args) {
        if (
          event.args.emoteId &&
          !usedEmoteLookup[event.args.emoteId] &&
          emoteLookup[event.args.emoteId]
        ) {
          const emote = emoteLookup[event.args.emoteId];
          usedEmotes.push(emote);
          usedEmoteLookup[event.args.emoteId] = emote;
        }
      }
    }
  );

  const emoteData = await compileEmotes(usedEmotes, projectRoot, {
    warnings,
  });

  return {
    usedEmotes: emoteData,
    emoteLookup,
  };
};

export const precompileMusic = (
  scenes,
  customEventsLookup,
  music,
  musicDriver
) => {
  const usedMusicIds = [];
  const driverMusic =
    musicDriver === "huge"
      ? music.filter((track) => track.type === "uge")
      : music.filter((track) => track.type !== "uge");

  walkDenormalizedScenesEvents(
    scenes,
    {
      customEventsLookup,
      maxDepth: MAX_NESTED_SCRIPT_DEPTH,
    },
    (cmd) => {
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
    }
  );
  const usedMusic = music
    .filter((track) => {
      return usedMusicIds.indexOf(track.id) > -1;
    })
    .map((track) => {
      // If wrong driver needed, fallback to first driver track
      if (
        (musicDriver === "huge" && track.type === "uge") ||
        (musicDriver !== "huge" && track.type !== "uge")
      ) {
        return track;
      }
      if (driverMusic[0]) {
        return {
          ...driverMusic[0],
          id: track.id,
        };
      }
    })
    .filter((track) => track)
    .map((track, index) => {
      return {
        ...track,
        dataName: `music_track_${index}_`,
      };
    });
  return { usedMusic };
};

export const precompileFonts = async (
  fonts,
  scenes,
  customEventsLookup,
  defaultFontId,
  projectRoot
) => {
  const defaultFont =
    fonts.find((font) => font.id === defaultFontId) || fonts[0];

  if (!defaultFont) {
    await ensureProjectAsset("assets/fonts/gbs-mono.png", {
      projectRoot,
    });
    await ensureProjectAsset("assets/fonts/gbs-mono.json", {
      projectRoot,
    });
    throw new Error(l10n("ERROR_MISSING_FONTS"));
  }

  const usedFontIds = [defaultFont.id];

  const addFont = (id) => {
    // If never seen this font before add it to the list
    if (usedFontIds.indexOf(id) === -1) {
      usedFontIds.push(id);
    }
  };

  const addFontsFromString = (s) => {
    (s.match(/(!F:[0-9a-f-]+!)/g) || [])
      .map((id) => id.substring(3).replace(/!$/, ""))
      .forEach(addFont);
  };

  walkDenormalizedScenesEvents(
    scenes,
    {
      customEventsLookup,
      maxDepth: MAX_NESTED_SCRIPT_DEPTH,
    },
    (cmd) => {
      if (cmd.args && cmd.args.fontId !== undefined) {
        addFont(cmd.args.fontId || fonts[0].id);
      }
      if (cmd.args && cmd.args.text !== undefined) {
        // Add fonts referenced in text
        addFontsFromString(String(cmd.args.text));
      }
      if (cmd.command && cmd.command === "EVENT_MENU" && cmd.args) {
        // Add fonts referenced in menu items
        for (let i = 1; i <= cmd.args.items; i++) {
          addFontsFromString(String(cmd.args[`option${i}`]));
        }
      }
    }
  );

  const usedFonts = [defaultFont].concat(
    fonts.filter((font) => {
      return font.id !== defaultFont.id && usedFontIds.indexOf(font.id) > -1;
    })
  );

  const fontData = await compileFonts(usedFonts, projectRoot);

  return { usedFonts: fontData };
};

export const precompileScenes = (
  scenes,
  customEvents,
  defaultPlayerSprites,
  usedBackgrounds,
  usedSprites,
  { warnings } = {}
) => {
  const customEventsLookup = keyBy(customEvents, "id");

  const scenesData = scenes.map((scene, sceneIndex) => {
    const backgroundIndex = usedBackgrounds.findIndex(
      (background) => background.id === scene.backgroundId
    );
    if (backgroundIndex < 0) {
      throw new Error(
        `Scene #${sceneIndex + 1} ${
          scene.name ? `'${scene.name}'` : ""
        } has missing or no background assigned.`
      );
    }

    const usedSpritesLookup = keyBy(usedSprites, "id");

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

    const actors = scene.actors.slice(0, MAX_ACTORS).filter((actor) => {
      return usedSprites.find((s) => s.id === actor.spriteSheetId);
    });

    const eventSpriteIds = [];
    const playerSpriteSheetId = scene.playerSpriteSheetId
      ? scene.playerSpriteSheetId
      : defaultPlayerSprites[scene.type];

    const playerSpriteIndex = usedSprites.findIndex(
      (s) => s.id === playerSpriteSheetId
    );

    if (playerSpriteIndex === -1) {
      warnings(
        l10n("WARNING_NO_PLAYER_SET_FOR_SCENE_TYPE", { type: scene.type })
      );
    }

    const projectiles = [];
    const actorsExclusiveLookup = {};
    const addProjectile = (data) => {
      const projectile = {
        ...data,
        hash: toProjectileHash({
          spriteSheetId: data.spriteSheetId,
          spriteStateId: data.spriteStateId,
          speed: data.speed,
          animSpeed: data.animSpeed,
          lifeTime: data.lifeTime,
          initialOffset: data.initialOffset,
          collisionGroup: data.collisionGroup,
          collisionMask: data.collisionMask,
        }),
      };
      if (!projectiles.find((p) => p.hash === projectile.hash)) {
        projectiles.push(projectile);
      }
    };

    let playerSpritePersist = false;
    walkDenormalizedSceneEvents(
      scene,
      {
        customEventsLookup,
        maxDepth: MAX_NESTED_SCRIPT_DEPTH,
      },
      (event, _scene, actor, _trigger) => {
        if (
          event.args &&
          event.args.spriteSheetId &&
          event.command !== EVENT_PLAYER_SET_SPRITE &&
          event.command !== EVENT_ACTOR_SET_SPRITE &&
          !event.args.__comment
        ) {
          eventSpriteIds.push(event.args.spriteSheetId);
        }

        if (
          event.args &&
          event.args.spriteSheetId &&
          event.command === "EVENT_LAUNCH_PROJECTILE" &&
          !event.args.__comment
        ) {
          addProjectile(event.args);
        }

        if (
          event.args &&
          event.args.spriteSheetId &&
          event.command === EVENT_ACTOR_SET_SPRITE
        ) {
          let actorId = event.args.actorId;
          if (actorId === "$self$" && actor) {
            actorId = actor.id;
          }
          const sprite = usedSpritesLookup[event.args.spriteSheetId];
          actorsExclusiveLookup[actorId] = Math.max(
            actorsExclusiveLookup[actorId] || 0,
            ((sprite ? sprite.numTiles : 0) || 0) * 2
          );
        }

        if (
          event.args &&
          event.args.spriteSheetId &&
          event.command === EVENT_PLAYER_SET_SPRITE &&
          event.args.persist
        ) {
          playerSpritePersist = true;
        }
      }
    );

    const actorSpriteIds = actors
      .filter((a) => !actorsExclusiveLookup[a.id])
      .map((a) => a.spriteSheetId);

    const sceneSpriteIds = [].concat(actorSpriteIds, eventSpriteIds);

    return {
      ...scene,
      backgroundIndex,
      actors,
      sprites: sceneSpriteIds.reduce((memo, spriteId) => {
        const spriteIndex = usedSprites.findIndex(
          (sprite) => sprite.id === spriteId
        );
        if (spriteIndex !== -1 && memo.indexOf(spriteIndex) === -1) {
          memo.push(spriteIndex);
        }
        return memo;
      }, []),
      triggers: scene.triggers.slice(0, MAX_TRIGGERS).filter((trigger) => {
        // Filter out unused triggers which cause slow down
        // When walking over
        return (
          (trigger.script &&
            trigger.script.length >= 1 &&
            trigger.script[0].command !== EVENT_END) ||
          (trigger.leaveScript &&
            trigger.leaveScript.length >= 1 &&
            trigger.leaveScript[0].command !== EVENT_END)
        );
      }),
      playerSpriteIndex,
      playerSpritePersist,
      actorsExclusiveLookup,
      actorsData: [],
      triggersData: [],
      projectiles,
    };
  });
  return scenesData;
};

const precompile = async (
  projectData,
  projectRoot,
  tmpPath,
  { progress, warnings }
) => {
  const customEventsLookup = keyBy(projectData.customEvents, "id");

  progress(EVENT_MSG_PRE_STRINGS);
  const strings = precompileStrings(projectData.scenes, customEventsLookup);

  progress(EVENT_MSG_PRE_IMAGES);
  const {
    usedBackgrounds,
    backgroundLookup,
    backgroundData,
    usedTilesets,
    usedTilesetLookup,
    usedTilemaps,
    usedTilemapAttrs,
  } = await precompileBackgrounds(
    projectData.backgrounds,
    projectData.scenes,
    customEventsLookup,
    projectRoot,
    tmpPath,
    { warnings }
  );

  progress(EVENT_MSG_PRE_UI_IMAGES);
  const { frameTiles, cursorTiles } = await precompileUIImages(
    projectRoot,
    tmpPath,
    {
      warnings,
    }
  );

  progress(EVENT_MSG_PRE_SPRITES);
  const { usedSprites, statesOrder, stateReferences } = await precompileSprites(
    projectData.spriteSheets,
    projectData.scenes,
    customEventsLookup,
    projectData.settings.defaultPlayerSprites,
    projectRoot,
    usedTilesets,
    {
      warnings,
    }
  );

  progress(EVENT_MSG_PRE_AVATARS);
  const { usedAvatars } = await precompileAvatars(
    projectData.avatars || [],
    projectData.scenes,
    customEventsLookup,
    projectRoot,
    {
      warnings,
    }
  );

  progress(EVENT_MSG_PRE_EMOTES);
  const { usedEmotes } = await precompileEmotes(
    projectData.emotes || [],
    projectData.scenes,
    customEventsLookup,
    projectRoot,
    {
      warnings,
    }
  );

  progress(EVENT_MSG_PRE_MUSIC);
  const { usedMusic } = await precompileMusic(
    projectData.scenes,
    customEventsLookup,
    projectData.music,
    projectData.settings.musicDriver
  );

  progress(EVENT_MSG_PRE_FONTS);
  const { usedFonts } = await precompileFonts(
    projectData.fonts,
    projectData.scenes,
    customEventsLookup,
    projectData.settings.defaultFontId,
    projectRoot,
    {
      warnings,
    }
  );

  progress(EVENT_MSG_PRE_SCENES);
  const sceneData = precompileScenes(
    projectData.scenes,
    projectData.customEvents,
    projectData.settings.defaultPlayerSprites,
    usedBackgrounds,
    usedSprites,
    {
      warnings,
    }
  );

  const {
    usedPalettes,
    scenePaletteIndexes,
    sceneActorPaletteIndexes,
    actorPaletteIndexes,
    eventPaletteIndexes,
  } = await precompilePalettes(
    projectData.scenes,
    projectData.settings,
    projectData.palettes,
    {
      warnings,
    }
  );

  progress(EVENT_MSG_PRE_COMPLETE);

  return {
    strings,
    usedBackgrounds,
    backgroundLookup,
    usedTilesets,
    usedTilesetLookup,
    usedTilemaps,
    usedTilemapAttrs,
    backgroundData,
    usedSprites,
    statesOrder,
    stateReferences,
    usedMusic,
    usedFonts,
    sceneData,
    frameTiles,
    cursorTiles,
    usedAvatars,
    usedEmotes,
    usedPalettes,
    scenePaletteIndexes,
    sceneActorPaletteIndexes,
    actorPaletteIndexes,
    eventPaletteIndexes,
  };
};

// #endregion

const compile = async (
  projectData,
  {
    projectRoot = "/tmp",
    engineFields = [],
    tmpPath = "/tmp",
    progress = (_msg) => {},
    warnings = (_msg) => {},
  } = {}
) => {
  const output = {};
  const symbols = {};

  if (projectData.scenes.length === 0) {
    throw new Error(
      "No scenes are included in your project. Add some scenes in the Game World editor and try again."
    );
  }

  const precompiled = await precompile(projectData, projectRoot, tmpPath, {
    progress,
    warnings,
  });

  const customColorsEnabled = projectData.settings.customColorsEnabled;
  const isSGB = projectData.settings.sgbEnabled;
  const isColor = customColorsEnabled || isSGB;

  const precompiledEngineFields = precompileEngineFields(engineFields);
  const customEventsLookup = keyBy(projectData.customEvents, "id");

  // Add UI data
  output["frame_image.c"] = compileFrameImage(precompiled.frameTiles);
  output["frame_image.h"] = compileFrameImageHeader(precompiled.frameTiles);
  output["cursor_image.c"] = compileCursorImage(precompiled.cursorTiles);
  output["cursor_image.h"] = compileCursorImageHeader(precompiled.cursorTiles);

  if (isSGB) {
    const sgbPath = await ensureProjectAsset("assets/sgb/border.png", {
      projectRoot,
      warnings,
    });
    output["border.c"] = await compileSGBImage(sgbPath);
  }

  progress(EVENT_MSG_COMPILING_EVENTS);
  // Hacky small wait to allow console to update before event loop is blocked
  // Can maybe move some of the compilation into workers to prevent this
  await new Promise((resolve) => setTimeout(resolve, 20));

  const variablesLookup = keyBy(projectData.variables, "id");
  const variableAliasLookup = {};

  // Determine which scene types need to support persisting player sprite
  const persistSceneTypes = precompiled.sceneData.reduce((memo, scene) => {
    if (scene.playerSpritePersist && !memo.includes(scene.type)) {
      memo.push(scene.type);
    }
    return memo;
  }, []);

  const persistSceneSpriteSymbols = {};
  persistSceneTypes.forEach((sceneType) => {
    const bankVar = `PLAYER_SPRITE_${sceneType}_BANK`;
    const dataVar = `PLAYER_SPRITE_${sceneType}_DATA`;
    variableAliasLookup[bankVar] = bankVar;
    variableAliasLookup[dataVar] = dataVar;
    persistSceneSpriteSymbols[sceneType] = spriteSheetSymbol(
      precompiled.usedSprites.findIndex(
        (sprite) =>
          projectData.settings.defaultPlayerSprites &&
          sprite.id === projectData.settings.defaultPlayerSprites[sceneType]
      )
    );
  });

  // Add event data
  const additionalScripts = {};
  const eventPtrs = precompiled.sceneData.map((scene, sceneIndex) => {
    const compileScript = (
      script,
      entityType,
      entity,
      entityIndex,
      loop,
      lock,
      scriptType
    ) => {
      let entityCode = "";
      let scriptTypeCode = "interact";

      if (entityType === "actor") {
        const scriptLookup = {
          script: "interact",
          updateScript: "update",
          hit1Script: "hit1",
          hit2Script: "hit2",
          hit3Script: "hit3",
        };
        entityCode = `a${entityIndex}`;
        scriptTypeCode = scriptLookup[scriptType] || scriptTypeCode;
      } else if (entityType === "trigger") {
        entityCode = `t${entityIndex}`;
        scriptTypeCode = "interact";
      } else if (entityType === "scene") {
        const scriptLookup = {
          script: "init",
          playerHit1Script: "p_hit1",
          playerHit2Script: "p_hit2",
          playerHit3Script: "p_hit3",
        };
        scriptTypeCode = scriptLookup[scriptType] || scriptTypeCode;
      }

      const scriptName = `script_s${sceneIndex}${entityCode}_${scriptTypeCode}`;

      if (script.length === 0) {
        return null;
      }

      const compiledScript = compileEntityEvents(scriptName, script, {
        scene,
        sceneIndex,
        scenes: precompiled.sceneData,
        music: precompiled.usedMusic,
        fonts: precompiled.usedFonts,
        defaultFontId: projectData.settings.defaultFontId,
        sprites: precompiled.usedSprites,
        statesOrder: precompiled.statesOrder,
        stateReferences: precompiled.stateReferences,
        avatars: precompiled.usedAvatars,
        emotes: precompiled.usedEmotes,
        backgrounds: precompiled.usedBackgrounds,
        strings: precompiled.strings,
        customEvents: projectData.customEvents,
        palettes: projectData.palettes,
        settings: projectData.settings,
        variablesLookup,
        variableAliasLookup,
        eventPaletteIndexes: precompiled.eventPaletteIndexes,
        characterEncoding: projectData.settings.defaultCharacterEncoding,
        labels: {},
        entityType,
        entityIndex,
        entity,
        warnings,
        loop,
        lock,
        init: scriptTypeCode === "init",
        engineFields: precompiledEngineFields,
        customEventsLookup,
        output: [],
        additionalScripts,
        symbols,
      });

      output[`${scriptName}.s`] = compiledScript;
      output[`${scriptName}.h`] = compileScriptHeader(scriptName);
      return scriptName;
    };

    const bankSceneEvents = (scene, sceneIndex) => {
      // Merge start scripts for actors with scene start script
      const initScript = []
        .concat(
          scene.actors.map((actor) => {
            const actorStartScript = actor.startScript || [];
            if (actorStartScript.length === 0) {
              return [];
            }
            return [].concat(
              {
                command: "INTERNAL_SET_CONTEXT",
                args: {
                  entity: actor,
                  entityType: "actor",
                  entityId: actor.id,
                },
              },
              actorStartScript.filter((event) => event.command !== EVENT_END)
            );
          }),
          scene.script.length > 0
            ? {
                command: "INTERNAL_SET_CONTEXT",
                args: {
                  entity: scene,
                  entityType: "scene",
                  entityId: scene.id,
                },
              }
            : [],
          persistSceneTypes.includes(scene.type) && !scene.playerSpriteSheetId
            ? {
                // Load sprite from var
                command: "EVENT_GBVM_SCRIPT",
                args: {
                  script: `VM_PUSH_CONST 0
VM_PUSH_VALUE PLAYER_SPRITE_${scene.type}_BANK
VM_PUSH_VALUE PLAYER_SPRITE_${scene.type}_DATA
VM_ACTOR_SET_SPRITESHEET_BY_REF .ARG2, .ARG1`,
                },
              }
            : [],
          [scene.script] || []
        )
        .flat();

      // Compile scene start script
      return compileScript(
        initScript,
        "scene",
        scene,
        sceneIndex,
        false,
        true,
        "script"
      );
    };

    const bankEntityEvents =
      (entityType, entityScriptField = "script") =>
      (entity, entityIndex) => {
        if (
          !entity[entityScriptField] ||
          entity[entityScriptField].length === 0
        ) {
          return null;
        }
        const lockScript =
          entityScriptField === "script" && !entity.collisionGroup;
        return compileScript(
          entity[entityScriptField],
          entityType,
          entity,
          entityIndex,
          entityScriptField === "updateScript",
          lockScript,
          entityScriptField
        );
      };

    const combineScripts = (scripts, canCollapse) => {
      const filteredScripts = scripts.filter(
        (s) => s.script && s.script.length > 0
      );
      if (!canCollapse || filteredScripts.length > 1) {
        return filteredScripts.map((s) => {
          return {
            command: "INTERNAL_IF_PARAM",
            args: {
              parameter: s.parameter,
              value: s.value,
            },
            children: {
              true: s.script,
            },
          };
        });
      } else if (filteredScripts[0]) {
        return filteredScripts[0].script;
      }
      return [];
    };

    const combinedPlayerHitScript = combineScripts(
      [
        { parameter: 0, value: 2, script: scene.playerHit1Script },
        { parameter: 0, value: 4, script: scene.playerHit2Script },
        { parameter: 0, value: 8, script: scene.playerHit3Script },
      ],
      false
    );

    return {
      start: bankSceneEvents(scene, sceneIndex),
      playerHit1: compileScript(
        combinedPlayerHitScript,
        "scene",
        scene,
        sceneIndex,
        false,
        false,
        "playerHit1Script"
      ),
      actorsMovement: scene.actors.map(
        bankEntityEvents("actor", "updateScript")
      ),
      actors: scene.actors.map((entity, entityIndex) => {
        if (!entity.collisionGroup) {
          return compileScript(
            entity.script,
            "actor",
            entity,
            entityIndex,
            false,
            true,
            "script"
          );
        }
        const combinedActorScript = combineScripts(
          [
            { parameter: 0, value: 0, script: entity.script },
            { parameter: 0, value: 2, script: entity.hit1Script },
            { parameter: 0, value: 4, script: entity.hit2Script },
            { parameter: 0, value: 8, script: entity.hit3Script },
          ],
          false
        );
        return compileScript(
          combinedActorScript,
          "actor",
          entity,
          entityIndex,
          false,
          false,
          "script"
        );
      }),
      triggers: scene.triggers.map((entity, entityIndex) => {
        const combinedTriggerScript = combineScripts(
          [
            { parameter: 0, value: 1, script: entity.script },
            { parameter: 0, value: 2, script: entity.leaveScript },
          ],
          true
        );

        return compileScript(
          combinedTriggerScript,
          "trigger",
          entity,
          entityIndex,
          false,
          true,
          "script"
        );
      }),
    };
  });

  Object.values(additionalScripts).forEach((additional) => {
    output[`${additional.symbol}.s`] = additional.compiledScript;
    output[`${additional.symbol}.h`] = compileScriptHeader(additional.symbol);
  });

  precompiled.usedTilesets.forEach((tileset, tilesetIndex) => {
    output[`tileset_${tilesetIndex}.c`] = compileTileset(tileset, tilesetIndex);
    output[`tileset_${tilesetIndex}.h`] = compileTilesetHeader(
      tileset,
      tilesetIndex
    );
  });

  // Add palette data
  precompiled.usedPalettes.forEach((palette, paletteIndex) => {
    output[`${paletteSymbol(paletteIndex)}.c`] = compilePalette(
      palette,
      paletteIndex
    );
    output[`${paletteSymbol(paletteIndex)}.h`] = compilePaletteHeader(
      palette,
      paletteIndex
    );
  });

  // Add background map data
  precompiled.usedBackgrounds.forEach((background, backgroundIndex) => {
    output[`background_${backgroundIndex}.c`] = compileBackground(
      background,
      backgroundIndex,
      {
        color: customColorsEnabled,
      }
    );
    output[`background_${backgroundIndex}.h`] = compileBackgroundHeader(
      background,
      backgroundIndex
    );
  });

  precompiled.usedTilemaps.forEach((tilemap, tilemapIndex) => {
    output[`tilemap_${tilemapIndex}.c`] = compileTilemap(tilemap, tilemapIndex);
    output[`tilemap_${tilemapIndex}.h`] = compileTilemapHeader(
      tilemap,
      tilemapIndex
    );
  });

  if (customColorsEnabled) {
    precompiled.usedTilemapAttrs.forEach((tilemapAttr, tilemapAttrIndex) => {
      output[`tilemap_attr_${tilemapAttrIndex}.c`] = compileTilemapAttr(
        tilemapAttr,
        tilemapAttrIndex
      );
      output[`tilemap_attr_${tilemapAttrIndex}.h`] = compileTilemapAttrHeader(
        tilemapAttr,
        tilemapAttrIndex
      );
    });
  }

  // Add sprite data
  precompiled.usedSprites.forEach((sprite, spriteIndex) => {
    output[`spritesheet_${spriteIndex}.c`] = compileSpriteSheet(
      sprite,
      spriteIndex,
      {
        statesOrder: precompiled.statesOrder,
        stateReferences: precompiled.stateReferences,
      }
    );
    output[`spritesheet_${spriteIndex}.h`] = compileSpriteSheetHeader(
      sprite,
      spriteIndex
    );
  });

  // Add font data
  precompiled.usedFonts.forEach((font, fontIndex) => {
    output[`font_${fontIndex}.c`] = compileFont(font, fontIndex);
    output[`font_${fontIndex}.h`] = compileFontHeader(font, fontIndex);
  });

  // Add avatar data
  const avatarFontSize = 16;
  const avatarFonts = chunk(precompiled.usedAvatars, avatarFontSize);
  avatarFonts.forEach((avatarFont, avatarFontIndex) => {
    output[`avatar_font_${avatarFontIndex}.c`] = compileAvatarFont(
      avatarFont,
      avatarFontIndex
    );
    output[`avatar_font_${avatarFontIndex}.h`] =
      compileAvatarFontHeader(avatarFontIndex);
  });

  // Add emote data
  precompiled.usedEmotes.forEach((emote, emoteIndex) => {
    output[`emote_${emoteIndex}.c`] = compileEmote(emote, emoteIndex);
    output[`emote_${emoteIndex}.h`] = compileEmoteHeader(emote, emoteIndex);
  });

  // Add scene data
  precompiled.sceneData.forEach((scene, sceneIndex) => {
    const sceneImage = precompiled.usedBackgrounds[scene.backgroundIndex];
    const collisionsLength = Math.ceil(sceneImage.width * sceneImage.height);
    const collisions = Array(collisionsLength)
      .fill(0)
      .map((_, index) => {
        return (scene.collisions && scene.collisions[index]) || 0;
      });
    const bgPalette = precompiled.scenePaletteIndexes[scene.id] || 0;
    const actorsPalette = precompiled.sceneActorPaletteIndexes[scene.id] || 0;

    output[`scene_${sceneIndex}.c`] = compileScene(scene, sceneIndex, {
      bgPalette,
      actorsPalette,
      color: isColor,
      eventPtrs,
    });
    output[`scene_${sceneIndex}.h`] = compileSceneHeader(scene, sceneIndex);
    output[`scene_${sceneIndex}_collisions.c`] = compileSceneCollisions(
      scene,
      sceneIndex,
      collisions
    );
    output[`scene_${sceneIndex}_collisions.h`] = compileSceneCollisionsHeader(
      scene,
      sceneIndex
    );

    if (scene.actors.length > 0) {
      output[`scene_${sceneIndex}_actors.h`] = compileSceneActorsHeader(
        scene,
        sceneIndex
      );
      output[`scene_${sceneIndex}_actors.c`] = compileSceneActors(
        scene,
        sceneIndex,
        precompiled.usedSprites,
        { eventPtrs }
      );
    }
    if (scene.triggers.length > 0) {
      output[`scene_${sceneIndex}_triggers.h`] = compileSceneTriggersHeader(
        scene,
        sceneIndex
      );
      output[`scene_${sceneIndex}_triggers.c`] = compileSceneTriggers(
        scene,
        sceneIndex,
        { eventPtrs }
      );
    }
    if (scene.sprites.length > 0) {
      output[`scene_${sceneIndex}_sprites.h`] = compileSceneSpritesHeader(
        scene,
        sceneIndex
      );
      output[`scene_${sceneIndex}_sprites.c`] = compileSceneSprites(
        scene,
        sceneIndex
      );
    }
    if (scene.projectiles.length > 0) {
      output[`scene_${sceneIndex}_projectiles.h`] =
        compileSceneProjectilesHeader(scene, sceneIndex);
      output[`scene_${sceneIndex}_projectiles.c`] = compileSceneProjectiles(
        scene,
        sceneIndex,
        precompiled.usedSprites
      );
    }
  });

  let startSceneIndex = precompiled.sceneData.findIndex(
    (m) => m.id === projectData.settings.startSceneId
  );

  // If starting scene is not found just use first scene
  if (startSceneIndex < 0) {
    startSceneIndex = 0;
  }

  const {
    startX,
    startY,
    startDirection,
    startMoveSpeed = 1,
    startAnimSpeed = 15,
    musicDriver,
  } = projectData.settings;

  // Add music data
  output["music_data.h"] = compileMusicHeader(precompiled.usedMusic);
  await compileMusicTracks(precompiled.usedMusic, {
    engine: musicDriver,
    output,
    tmpPath,
    projectRoot,
    progress,
    warnings,
  });

  output["game_globals.i"] = compileGameGlobalsInclude(
    variableAliasLookup,
    precompiled.stateReferences
  );
  output[`script_engine_init.s`] = compileScriptEngineInit({
    startX,
    startY,
    startDirection,
    startSceneIndex,
    startMoveSpeed,
    startAnimSpeed,
    fonts: precompiled.usedFonts,
    avatarFonts,
    engineFields,
    engineFieldValues: projectData.engineFieldValues,
    persistSceneSpriteSymbols,
  });
  output[`data_bootstrap.h`] =
    `#ifndef DATA_PTRS_H\n#define DATA_PTRS_H\n\n` +
    `#include "bankdata.h"\n` +
    `#include "gbs_types.h"\n\n` +
    `extern const INT16 start_scene_x;\n` +
    `extern const INT16 start_scene_y;\n` +
    `extern const direction_e start_scene_dir;\n` +
    `extern const far_ptr_t start_scene;\n` +
    `extern const UBYTE start_player_move_speed;\n` +
    `extern const UBYTE start_player_anim_tick;\n\n` +
    `extern const far_ptr_t ui_fonts[];\n\n` +
    `void bootstrap_init() __banked;\n\n` +
    `#endif\n`;

  output[`states_defines.h`] =
    `#ifndef STATES_DEFINES_H\n#define STATES_DEFINES_H\n\n` +
    // Add define fields from engineFields
    engineFields
      .filter(
        // Add define types without explict file set to data/data_bootstrap.h
        (engineField) => engineField.cType === "define" && !engineField.file
      )
      .map((engineField, defineIndex, defineFields) => {
        const engineValue = projectData.engineFieldValues.find(
          (v) => v.id === engineField.key
        );
        const value =
          engineValue && engineValue.value !== undefined
            ? engineValue.value
            : engineField.defaultValue;
        return `#define ${String(engineField.key).padEnd(32, " ")} ${value}${
          defineIndex === defineFields.length - 1 ? "\n\n" : "\n"
        }`;
      })
      .join("") +
    `#endif\n`;

  output[`game_signature.c`] = compileSaveSignature(
    JSON.stringify(projectData)
  );

  return {
    files: output,
  };
};

export default compile;
