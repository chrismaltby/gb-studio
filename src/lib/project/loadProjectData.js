import fs from "fs-extra";
import path from "path";
import uuid from "uuid/v4";
import loadAllBackgroundData from "./loadBackgroundData";
import loadAllSpriteData from "./loadSpriteData";
import loadAllMusicData from "./loadMusicData";
import migrateProject from "./migrateProject";
import { indexByFn } from "../helpers/array";

const elemKey = (elem) => {
  return (elem.plugin ? `${elem.plugin}/` : "") + elem.filename;
};

const indexByFilename = indexByFn(elemKey);

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
  const json = migrateProject(await fs.readJson(projectPath));

  const projectRoot = path.dirname(projectPath);

  const [backgrounds, sprites, music] = await Promise.all([
    loadAllBackgroundData(projectRoot),
    loadAllSpriteData(projectRoot),
    loadAllMusicData(projectRoot),
  ]);

  // Merge stored backgrounds data with file system data
  const oldBackgroundByFilename = indexByFilename(json.backgrounds || []);

  const fixedBackgroundIds = backgrounds
    .map((background) => {
      const oldBackground = oldBackgroundByFilename[elemKey(background)];
      if (oldBackground) {
        return {
          ...background,
          id: oldBackground.id,
        };
      }
      return background;
    })
    .sort(sortByName);

  // Merge stored sprite data with file system data
  const oldSpriteByFilename = indexByFilename(json.spriteSheets || []);

  const fixedSpriteIds = sprites
    .map((sprite) => {
      const oldSprite = oldSpriteByFilename[elemKey(sprite)];
      if (oldSprite) {
        return {
          ...sprite,
          id: oldSprite.id,
        };
      }
      return sprite;
    })
    .sort(sortByName);

  // Merge stored music data with file system data
  const oldMusicByFilename = indexByFilename(json.music || []);

  const fixedMusicIds = music
    .map((track) => {
      const oldTrack = oldMusicByFilename[elemKey(track)];
      if (oldTrack) {
        return {
          ...track,
          id: oldTrack.id,
        };
      }
      return track;
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
      colors: ["f8e8c8", "d89048", "a82820", "301850"],
    },
    {
      id: "default-bg-2",
      name: "Default BG 2",
      colors: ["e0f8a0", "78c838", "488818", "081800"],
    },
    {
      id: "default-bg-3",
      name: "Default BG 3",
      colors: ["f8d8a8", "e0a878", "785888", "002030"],
    },
    {
      id: "default-bg-4",
      name: "Default BG 4",
      colors: ["b8d0d0", "d880d8", "8000a0", "380000"],
    },
    {
      id: "default-bg-5",
      name: "Default BG 5",
      colors: ["f8f8b8", "90c8c8", "486878", "082048"],
    },
    {
      id: "default-bg-6",
      name: "Default BG 6",
      colors: ["f8d8b0", "78c078", "688840", "583820"],
    },
    {
      id: "default-sprite",
      name: "Default Sprites",
      colors: ["d8d8c0", "c8b070", "b05010", "000000"],
    },
    {
      id: "default-ui",
      name: "Default UI",
      colors: ["f8c0f8", "e89850", "983860", "383898"],
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

  return {
    ...json,
    backgrounds: fixedBackgroundIds,
    spriteSheets: fixedSpriteIds,
    music: fixedMusicIds,
    scenes: fixedScenes,
    customEvents: fixedCustomEvents,
    palettes: fixedPalettes,
  };
};

export default loadProject;
