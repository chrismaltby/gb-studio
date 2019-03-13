import fs from "fs-extra";
import path from "path";
import loadAllImageData from "./loadImageData";
import loadAllSpriteData from "./loadSpriteData";
import loadAllMusicData from "./loadMusicData";

const loadProject = async projectPath => {
  const json = await fs.readJson(projectPath);

  const projectRoot = path.dirname(projectPath);

  const backgrounds = await loadAllImageData(projectRoot);
  const sprites = await loadAllSpriteData(projectRoot);
  const music = await loadAllMusicData(projectRoot);

  const oldImageFilenamesToIds = (json.images || []).reduce((memo, oldData) => {
    memo[oldData.filename] = oldData.id;
    return memo;
  }, {});

  // Merge stored images data with file system data
  const fixedImageIds = backgrounds
    .map(image => {
      const oldId = oldImageFilenamesToIds[image.filename];
      if (oldId) {
        image.id = oldId;
      }
      return image;
    })
    .filter(
      image =>
        // Only allow images with valid dimensions
        image.width <= 32 &&
        image.height <= 32 &&
        image.width >= 20 &&
        image.height >= 18 &&
        image.width === Math.floor(image.width) &&
        image.height === Math.floor(image.height)
    );

  json.images = fixedImageIds;

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
