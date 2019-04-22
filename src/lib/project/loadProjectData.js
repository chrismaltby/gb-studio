import fs from "fs-extra";
import path from "path";
import loadAllBackgroundData from "./loadBackgroundData";
import loadAllSpriteData from "./loadSpriteData";
import loadAllMusicData from "./loadMusicData";

const loadProject = async projectPath => {
  const json = await fs.readJson(projectPath);

  const projectRoot = path.dirname(projectPath);

  const backgroundsPromise = loadAllBackgroundData(projectRoot);
  const spritesPromise = loadAllSpriteData(projectRoot);
  const musicPromise = loadAllMusicData(projectRoot);

  const [backgrounds, sprites, music] = await Promise.all(
    [backgroundsPromise, spritesPromise, musicPromise]
  );

  const oldBackgroundFilenamesToIds = (json.backgrounds || []).reduce(
    (memo, oldData) => {
      memo[oldData.filename] = oldData.id;
      return memo;
    },
    {}
  );

  // Merge stored backgrounds data with file system data
  const fixedBackgroundIds = backgrounds
    .map(background => {
      const oldId = oldBackgroundFilenamesToIds[background.filename];
      if (oldId) {
        background.id = oldId;
      }
      return background;
    })
    .filter(
      background =>
        // Only allow backgrounds with valid dimensions
        background.width <= 32 &&
        background.height <= 32 &&
        background.width >= 20 &&
        background.height >= 18 &&
        background.width === Math.floor(background.width) &&
        background.height === Math.floor(background.height)
    );

  json.backgrounds = fixedBackgroundIds;

  // Merge stored sprite data with file system data
  const oldSpriteFilenamesToIds = (json.spriteSheets || []).reduce(
    (memo, oldData) => {
      memo[oldData.filename] = oldData.id;
      return memo;
    },
    {}
  );

  const fixedSpriteIds = sprites
    .map(sprite => {
      const oldId = oldSpriteFilenamesToIds[sprite.filename];
      if (oldId) {
        sprite.id = oldId;
      }
      return sprite;
    })
    .filter(sprite => sprite.type !== "invalid");

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

  return json;
};

export default loadProject;
