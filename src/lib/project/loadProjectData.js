import fs from "fs-extra";
import path from "path";
import uuid from "uuid/v4";
import loadAllBackgroundData from "./loadBackgroundData";
import loadAllSpriteData from "./loadSpriteData";
import loadAllMusicData from "./loadMusicData";
import migrateProject from "./migrateProject";
import { indexByFn } from "../helpers/array";

const elemKey = elem => {
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

const loadProject = async projectPath => {
  const json = migrateProject(await fs.readJson(projectPath));

  const projectRoot = path.dirname(projectPath);

  const [backgrounds, sprites, music] = await Promise.all([
    loadAllBackgroundData(projectRoot),
    loadAllSpriteData(projectRoot),
    loadAllMusicData(projectRoot)
  ]);

  // Merge stored backgrounds data with file system data
  const oldBackgroundByFilename = indexByFilename(json.backgrounds || []);

  const fixedBackgroundIds = backgrounds
    .map(background => {
      const oldBackground = oldBackgroundByFilename[elemKey(background)];
      if (oldBackground) {
        return {
          ...background,
          id: oldBackground.id
        };
      }
      return background;
    })
    .sort(sortByName);

  // Merge stored sprite data with file system data
  const oldSpriteByFilename = indexByFilename(json.spriteSheets || []);

  const fixedSpriteIds = sprites
    .map(sprite => {
      const oldSprite = oldSpriteByFilename[elemKey(sprite)];
      if (oldSprite) {
        return {
          ...sprite,
          id: oldSprite.id
        };
      }
      return sprite;
    })
    .sort(sortByName);

  // Merge stored music data with file system data
  const oldMusicByFilename = indexByFilename(json.music || []);

  const fixedMusicIds = music
    .map(track => {
      const oldTrack = oldMusicByFilename[elemKey(track)];
      if (oldTrack) {
        return {
          ...track,
          id: oldTrack.id
        };
      }
      return track;
    })
    .sort(sortByName);

  const addMissingEntityId = entity => {
    if (!entity.id) {
      return {
        ...entity,
        id: uuid()
      };
    }
    return entity;
  };

  // Fix ids on actors and triggers
  const fixedScenes = (json.scenes || []).map(scene => {
    return {
      ...scene,
      actors: scene.actors.map(addMissingEntityId),
      triggers: scene.triggers.map(addMissingEntityId)
    };
  });

  const fixedCustomEvents = (json.customEvents || []).map(addMissingEntityId);

  return {
    ...json,
    backgrounds: fixedBackgroundIds,
    spriteSheets: fixedSpriteIds,
    music: fixedMusicIds,
    scenes: fixedScenes,
    customEvents: fixedCustomEvents
  };
};

export default loadProject;
