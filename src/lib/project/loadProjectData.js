import fs from "fs-extra";
import path from "path";
import uuid from "uuid/v4";
import loadAllBackgroundData from "./loadBackgroundData";
import loadAllSpriteData from "./loadSpriteData";
import loadAllMusicData from "./loadMusicData";

const loadProject = async projectPath => {
  const json = await fs.readJson(projectPath);

  const projectRoot = path.dirname(projectPath);

  const backgrounds = await loadAllBackgroundData(projectRoot);
  const sprites = await loadAllSpriteData(projectRoot);
  const music = await loadAllMusicData(projectRoot);

  const oldBackgroundFilenamesToIds = (json.backgrounds || []).reduce(
    (memo, oldData) => {
      memo[oldData.filename] = oldData.id;
      return memo;
    },
    {}
  );

  // Merge stored backgrounds data with file system data
  const fixedBackgroundIds = backgrounds.map(background => {
    const oldId = oldBackgroundFilenamesToIds[background.filename];
    if (oldId) {
      background.id = oldId;
    }
    return background;
  });

  json.backgrounds = fixedBackgroundIds;

  // Merge stored sprite data with file system data
  const oldSpriteFilenamesToIds = (json.spriteSheets || []).reduce(
    (memo, oldData) => {
      memo[oldData.filename] = oldData.id;
      return memo;
    },
    {}
  );

  const fixedSpriteIds = sprites.map(sprite => {
    const oldId = oldSpriteFilenamesToIds[sprite.filename];
    if (oldId) {
      sprite.id = oldId;
    }
    return sprite;
  });

  json.spriteSheets = fixedSpriteIds;

  // Merge stored music data with file system data
  const oldMusicFilenamesToIds = (json.music || []).reduce((memo, oldData) => {
    memo[oldData.filename] = oldData.id;
    return memo;
  }, {});

  const fixedMusicIds = music.map(music => {
    const oldId = oldMusicFilenamesToIds[music.filename];
    if (oldId) {
      music.id = oldId;
    }
    return music;
  });

  json.music = fixedMusicIds;

  const addMissingEntityId = entity => {
    if (!entity.id) {
      entity.id = uuid();
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

  json.scenes = fixedScenes;

  return json;
};

export default loadProject;
