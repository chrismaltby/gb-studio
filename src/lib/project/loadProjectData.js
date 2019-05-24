import fs from "fs-extra";
import path from "path";
import uuid from "uuid/v4";
import loadAllBackgroundData from "./loadBackgroundData";
import loadAllSpriteData from "./loadSpriteData";
import loadAllMusicData from "./loadMusicData";
import migrateProject from "./migrateProject";
import { indexBy } from "../helpers/array";

const indexByFilename = indexBy("filename");

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

  const fixedBackgroundIds = backgrounds.map(background => {
    const oldBackground = oldBackgroundByFilename[background.filename];
    if (oldBackground) {
      return {
        ...background,
        id: oldBackground.id
      };
    }
    return background;
  });

  // Merge stored sprite data with file system data
  const oldSpriteByFilename = indexByFilename(json.spriteSheets || []);

  const fixedSpriteIds = sprites.map(sprite => {
    const oldSprite = oldSpriteByFilename[sprite.filename];
    if (oldSprite) {
      return {
        ...sprite,
        id: oldSprite.id
      };
    }
    return sprite;
  });

  // Merge stored music data with file system data
  const oldMusicByFilename = indexByFilename(json.music || []);

  const fixedMusicIds = music.map(track => {
    const oldTrack = oldMusicByFilename[track.filename];
    if (oldTrack) {
      return {
        ...track,
        id: oldTrack.id
      };
    }
    return track;
  });

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

  return {
    ...json,
    backgrounds: fixedBackgroundIds,
    spriteSheets: fixedSpriteIds,
    music: fixedMusicIds,
    scenes: fixedScenes
  };
};

export default loadProject;
