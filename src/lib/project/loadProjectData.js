import fs from "fs-extra";
import path from "path";
import uuid from "uuid/v4";
import loadAllBackgroundData from "./loadBackgroundData";
import loadAllSpriteData from "./loadSpriteData";
import loadAllMusicData from "./loadMusicData";
import loadAllFontData from "./loadFontData";
import loadAllAvatarData from "./loadAvatarData";
import loadAllEmoteData from "./loadEmoteData";
import migrateProject from "./migrateProject";
import { indexByFn, indexBy } from "../helpers/array";

const elemKey = (elem) => {
  return (elem.plugin ? `${elem.plugin}/` : "") + elem.filename;
};

const indexByFilename = indexByFn(elemKey);
const indexByInode = indexBy("inode");

const sortByName = (a, b) => {
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

const loadProject = async (projectPath) => {
  const projectRoot = path.dirname(projectPath);
  const json = migrateProject(await fs.readJson(projectPath), projectRoot);

  const [backgrounds, sprites, music, fonts, avatars, emotes] =
    await Promise.all([
      loadAllBackgroundData(projectRoot),
      loadAllSpriteData(projectRoot),
      loadAllMusicData(projectRoot),
      loadAllFontData(projectRoot),
      loadAllAvatarData(projectRoot),
      loadAllEmoteData(projectRoot),
    ]);

  // Merge stored backgrounds data with file system data
  const oldBackgroundByFilename = indexByFilename(json.backgrounds || []);
  const oldBackgroundByInode = indexByInode(json.backgrounds || []);

  const fixedBackgroundIds = backgrounds
    .map((background) => {
      const oldBackground =
        oldBackgroundByFilename[elemKey(background)] ||
        oldBackgroundByInode[background.inode];
      if (oldBackground) {
        return {
          ...background,
          id: oldBackground.id,
          _v: oldBackground._v,
          tileColors:
            oldBackground?.tileColors !== undefined
              ? oldBackground.tileColors
              : [],
        };
      }
      return background;
    })
    .sort(sortByName);

  // Merge stored sprite data with file system data
  const oldSpriteByFilename = indexByFilename(json.spriteSheets || []);
  const oldSpriteByInode = indexByInode(json.spriteSheets || []);
  const modifiedSpriteIds = [];

  const fixedSpriteIds = sprites
    .map((sprite) => {
      const oldSprite =
        oldSpriteByFilename[elemKey(sprite)] || oldSpriteByInode[sprite.inode];
      const oldData = oldSprite || {};
      const id = oldData.id || sprite.id;

      if (!oldSprite || !oldSprite.states || oldSprite.numTiles === undefined) {
        modifiedSpriteIds.push(id);
      }

      return {
        ...sprite,
        ...oldData,
        id,
        _v: oldData._v || sprite._v,
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
  const oldMusicByInode = indexByInode(json.music || []);

  const fixedMusicIds = music
    .map((track) => {
      const oldTrack =
        oldMusicByFilename[elemKey(track)] || oldMusicByInode[track.inode];
      if (oldTrack) {
        return {
          ...track,
          id: oldTrack.id,
          _v: oldTrack._v,
          settings: {
            ...oldTrack.settings,
          },
        };
      }
      return track;
    })
    .sort(sortByName);

  // Merge stored fonts data with file system data
  const oldFontByFilename = indexByFilename(json.fonts || []);
  const oldFontByInode = indexByInode(json.fonts || []);

  const fixedFontIds = fonts
    .map((font) => {
      const oldFont =
        oldFontByFilename[elemKey(font)] || oldFontByInode[font.inode];
      if (oldFont) {
        return {
          ...font,
          id: oldFont.id,
        };
      }
      return font;
    })
    .sort(sortByName);

  // Merge stored avatars data with file system data
  const oldAvatarByFilename = indexByFilename(json.avatars || []);
  const oldAvatarByInode = indexByInode(json.avatars || []);

  const fixedAvatarIds = avatars
    .map((avatar) => {
      const oldAvatar =
        oldAvatarByFilename[elemKey(avatar)] || oldAvatarByInode[avatar.inode];
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
  const oldEmoteByInode = indexByInode(json.emotes || []);

  const fixedEmoteIds = emotes
    .map((emote) => {
      const oldEmote =
        oldEmoteByFilename[elemKey(emote)] || oldEmoteByInode[emote.inode];
      if (oldEmote) {
        return {
          ...emote,
          id: oldEmote.id,
        };
      }
      return emote;
    })
    .sort(sortByName);

  const addMissingEntityId = (entity) => {
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
  ];

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

  return {
    data: {
      ...json,
      backgrounds: fixedBackgroundIds,
      spriteSheets: fixedSpriteIds,
      music: fixedMusicIds,
      fonts: fixedFontIds,
      avatars: fixedAvatarIds,
      emotes: fixedEmoteIds,
      scenes: fixedScenes,
      customEvents: fixedCustomEvents,
      palettes: fixedPalettes,
      engineFieldValues: fixedEngineFieldValues,
    },
    modifiedSpriteIds,
  };
};

export default loadProject;
