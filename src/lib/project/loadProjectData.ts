import fs from "fs-extra";
import path from "path";
import uuid from "uuid/v4";
import loadAllBackgroundData from "./loadBackgroundData";
import loadAllSpriteData from "./loadSpriteData";
import loadAllMusicData from "./loadMusicData";
import loadAllFontData from "./loadFontData";
import loadAllAvatarData from "./loadAvatarData";
import loadAllEmoteData from "./loadEmoteData";
import loadAllSoundData from "./loadSoundData";
import loadAllScriptEvents, { ScriptEventDef } from "./loadScriptEvents";
import migrateProject from "./migrateProject";
import type { ProjectData } from "store/features/project/projectActions";
import type { Asset } from "shared/lib/helpers/assets";
import keyBy from "lodash/keyBy";
import { cloneDictionary } from "lib/helpers/clone";
import { Dictionary } from "@reduxjs/toolkit";

const toUnixFilename = (filename: string) => {
  return filename.replace(/\\/g, "/");
};

const toAssetFilename = (elem: Asset) => {
  return (elem.plugin ? `${elem.plugin}/` : "") + toUnixFilename(elem.filename);
};

const indexByFilename = <T extends Asset>(arr: T[]): Record<string, T> =>
  keyBy(arr || [], toAssetFilename);

const sortByName = (a: { name: string }, b: { name: string }) => {
  const aName = a.name.toUpperCase();
  const bName = b.name.toUpperCase();
  if (aName < bName) {
    return -1;
  }
  if (aName > bName) {
    return 1;
  }
  return 0;
};

const loadProject = async (
  projectPath: string
): Promise<{
  data: ProjectData;
  scriptEventDefs: Dictionary<ScriptEventDef>;
  modifiedSpriteIds: string[];
}> => {
  const projectRoot = path.dirname(projectPath);
  const json = migrateProject(
    await fs.readJson(projectPath),
    projectRoot
  ) as ProjectData;

  const [backgrounds, sprites, music, sounds, fonts, avatars, emotes] =
    await Promise.all([
      loadAllBackgroundData(projectRoot),
      loadAllSpriteData(projectRoot),
      loadAllMusicData(projectRoot),
      loadAllSoundData(projectRoot),
      loadAllFontData(projectRoot),
      loadAllAvatarData(projectRoot),
      loadAllEmoteData(projectRoot),
    ]);

  // Merge stored backgrounds data with file system data
  const oldBackgroundByFilename = indexByFilename(json.backgrounds || []);

  const fixedBackgroundIds = backgrounds
    .map((background) => {
      const oldBackground =
        oldBackgroundByFilename[toAssetFilename(background)];
      if (oldBackground) {
        return {
          ...background,
          id: oldBackground.id,
          symbol:
            oldBackground?.symbol !== undefined
              ? oldBackground.symbol
              : background.symbol,
          tileColors:
            oldBackground?.tileColors !== undefined
              ? oldBackground.tileColors
              : [],
        };
      }
      return {
        ...background,
        tileColors: [],
      };
    })
    .sort(sortByName);

  // Merge stored sprite data with file system data
  const oldSpriteByFilename = indexByFilename(json.spriteSheets || []);
  const modifiedSpriteIds: string[] = [];

  const fixedSpriteIds = sprites
    .map((sprite) => {
      const oldSprite = oldSpriteByFilename[toAssetFilename(sprite)];
      const oldData = oldSprite || {};
      const id = oldData.id || sprite.id;

      if (!oldSprite || !oldSprite.states || oldSprite.numTiles === undefined) {
        modifiedSpriteIds.push(id);
      }

      return {
        ...sprite,
        ...oldData,
        id,
        symbol: oldData?.symbol !== undefined ? oldData.symbol : sprite.symbol,
        filename: sprite.filename,
        name: oldData.name || sprite.name,
        canvasWidth: oldData.canvasWidth || 32,
        canvasHeight: oldData.canvasHeight || 32,
        states: (
          oldData.states || [
            {
              id: uuid(),
              name: "",
              animationType: "multi_movement",
              flipLeft: true,
            },
          ]
        ).map((oldState) => {
          return {
            ...oldState,
            animations: Array.from(Array(8)).map((_, animationIndex) => ({
              id:
                (oldState.animations &&
                  oldState.animations[animationIndex] &&
                  oldState.animations[animationIndex].id) ||
                uuid(),
              frames: (oldState.animations &&
                oldState.animations[animationIndex] &&
                oldState.animations[animationIndex].frames) || [
                {
                  id: uuid(),
                  tiles: [],
                },
              ],
            })),
          };
        }),
      };
    })
    .sort(sortByName);

  // Merge stored music data with file system data
  const oldMusicByFilename = indexByFilename(json.music || []);

  const fixedMusicIds = music
    .map((track) => {
      const oldTrack = oldMusicByFilename[toAssetFilename(track)];
      if (oldTrack) {
        return {
          ...track,
          id: oldTrack.id,
          symbol:
            oldTrack?.symbol !== undefined ? oldTrack.symbol : track.symbol,
          settings: {
            ...oldTrack.settings,
          },
        };
      }
      return track;
    })
    .sort(sortByName);

  // Merge stored sound effect data with file system data
  const oldSoundByFilename = indexByFilename(json.sounds || []);

  const fixedSoundIds = sounds
    .map((sound) => {
      const oldSound = oldSoundByFilename[toAssetFilename(sound)];
      if (oldSound) {
        return {
          ...sound,
          id: oldSound.id,
          symbol:
            oldSound?.symbol !== undefined ? oldSound.symbol : sound.symbol,
        };
      }
      return sound;
    })
    .sort(sortByName);

  // Merge stored fonts data with file system data
  const oldFontByFilename = indexByFilename(json.fonts || []);

  const fixedFontIds = fonts
    .map((font) => {
      const oldFont = oldFontByFilename[toAssetFilename(font)];
      if (oldFont) {
        return {
          ...font,
          id: oldFont.id,
          symbol: oldFont?.symbol !== undefined ? oldFont.symbol : font.symbol,
        };
      }
      return font;
    })
    .sort(sortByName);

  // Merge stored avatars data with file system data
  const oldAvatarByFilename = indexByFilename(json.avatars || []);

  const fixedAvatarIds = avatars
    .map((avatar) => {
      const oldAvatar = oldAvatarByFilename[toAssetFilename(avatar)];
      if (oldAvatar) {
        return {
          ...avatar,
          id: oldAvatar.id,
        };
      }
      return avatar;
    })
    .sort(sortByName);

  // Merge stored emotes data with file system data
  const oldEmoteByFilename = indexByFilename(json.emotes || []);

  const fixedEmoteIds = emotes
    .map((emote) => {
      const oldEmote = oldEmoteByFilename[toAssetFilename(emote)];
      if (oldEmote) {
        return {
          ...emote,
          id: oldEmote.id,
          symbol:
            oldEmote?.symbol !== undefined ? oldEmote.symbol : emote.symbol,
        };
      }
      return emote;
    })
    .sort(sortByName);

  const addMissingEntityId = <T extends { id: string }>(entity: T) => {
    if (!entity.id) {
      return {
        ...entity,
        id: uuid(),
      };
    }
    return entity;
  };

  // Fix ids on actors and triggers
  const fixedScenes = (json.scenes || []).map((scene) => {
    return {
      ...scene,
      actors: scene.actors.map(addMissingEntityId),
      triggers: scene.triggers.map(addMissingEntityId),
    };
  });

  const fixedCustomEvents = (json.customEvents || []).map(addMissingEntityId);

  const defaultPalettes = [
    {
      id: "default-bg-1",
      name: "Default BG 1",
      colors: ["F8E8C8", "D89048", "A82820", "301850"],
    },
    {
      id: "default-bg-2",
      name: "Default BG 2",
      colors: ["E0F8A0", "78C838", "488818", "081800"],
    },
    {
      id: "default-bg-3",
      name: "Default BG 3",
      colors: ["F8D8A8", "E0A878", "785888", "002030"],
    },
    {
      id: "default-bg-4",
      name: "Default BG 4",
      colors: ["B8D0D0", "D880D8", "8000A0", "380000"],
    },
    {
      id: "default-bg-5",
      name: "Default BG 5",
      colors: ["F8F8B8", "90C8C8", "486878", "082048"],
    },
    {
      id: "default-bg-6",
      name: "Default BG 6",
      colors: ["F8D8B0", "78C078", "688840", "583820"],
    },
    {
      id: "default-sprite",
      name: "Default Sprites",
      colors: ["F8F0E0", "D88078", "B05010", "000000"],
    },
    {
      id: "default-ui",
      name: "Default UI",
      colors: ["F8F8B8", "90C8C8", "486878", "082048"],
    },
  ] as {
    id: string;
    name: string;
    colors: [string, string, string, string];
  }[];

  const fixedPalettes = (json.palettes || []).map(addMissingEntityId);

  for (let i = 0; i < defaultPalettes.length; i++) {
    const defaultPalette = defaultPalettes[i];
    const existingPalette = fixedPalettes.find(
      (p) => p.id === defaultPalette.id
    );
    if (existingPalette) {
      existingPalette.defaultName = defaultPalette.name;
      existingPalette.defaultColors = defaultPalette.colors;
    } else {
      fixedPalettes.push({
        ...defaultPalette,
        defaultName: defaultPalette.name,
        defaultColors: defaultPalette.colors,
      });
    }
  }

  const fixedEngineFieldValues = json.engineFieldValues || [];

  const scriptEvents = cloneDictionary(await loadAllScriptEvents(projectRoot));

  return {
    data: {
      ...json,
      backgrounds: fixedBackgroundIds,
      spriteSheets: fixedSpriteIds,
      music: fixedMusicIds,
      sounds: fixedSoundIds,
      fonts: fixedFontIds,
      avatars: fixedAvatarIds,
      emotes: fixedEmoteIds,
      scenes: fixedScenes,
      customEvents: fixedCustomEvents,
      palettes: fixedPalettes,
      engineFieldValues: fixedEngineFieldValues,
    },
    modifiedSpriteIds,
    scriptEventDefs: cloneDictionary(scriptEvents),
  };
};

export default loadProject;
