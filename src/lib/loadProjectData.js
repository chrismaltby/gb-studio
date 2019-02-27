import fs from "fs-extra";
import path from "path";
import loadImageData from "./loadImageData";
import loadSpriteData from "./loadSpriteData";

const loadProject = async projectPath => {
  const json = await fs.readJson(projectPath);

  const projectRoot = path.dirname(projectPath);

  const backgrounds = await loadImageData(projectRoot);
  const sprites = await loadSpriteData(projectRoot);

  const oldImageFilenamesToIds = (json.images || []).reduce((memo, oldData) => {
    memo[oldData.filename] = oldData.id;
    return memo;
  }, {});

  // Merge stored images data with file system data
  const fixedImageIds = backgrounds.map(image => {
    const oldId = oldImageFilenamesToIds[image.filename];
    if (oldId) {
      image.id = oldId;
    }
    return image;
  });

  json.images = fixedImageIds;

  const oldSpriteFilenamesToIds = (json.spriteSheets || []).reduce(
    (memo, oldData) => {
      memo[oldData.filename] = oldData.id;
      return memo;
    },
    {}
  );

  // Merge stored sprite data with file system data
  const fixedSpriteIds = sprites.map(sprite => {
    const oldId = oldSpriteFilenamesToIds[sprite.filename];
    if (oldId) {
      sprite.id = oldId;
    }
    return sprite;
  });
  json.spriteSheets = fixedSpriteIds;

  return json;
};

export default loadProject;
