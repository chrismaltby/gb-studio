import fs from "fs-extra";
import path from "path";
import loadAllImageData from "./loadImageData";
import loadAllSpriteData from "./loadSpriteData";

const loadProject = async projectPath => {
  const json = await fs.readJson(projectPath);

  const projectRoot = path.dirname(projectPath);

  const backgrounds = await loadAllImageData(projectRoot);
  const sprites = await loadAllSpriteData(projectRoot);

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

  const oldSpriteFilenamesToIds = (json.spriteSheets || []).reduce(
    (memo, oldData) => {
      memo[oldData.filename] = oldData.id;
      return memo;
    },
    {}
  );

  // Merge stored sprite data with file system data
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

  return json;
};

export default loadProject;
