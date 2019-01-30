import fs from "fs-extra";
import path from "path";
import loadImageData from "./loadImageData";

const loadProject = async projectPath => {
  const json = await fs.readJson(projectPath);
  const projectRoot = path.dirname(projectPath);
  const backgrounds = await loadImageData(projectRoot);

  const oldFilenamesToIds = json.images.reduce((memo, oldData) => {
    memo[oldData.filename] = oldData.id;
    return memo;
  }, {});

  const fixedImageIds = backgrounds.map(image => {
    const oldId = oldFilenamesToIds[image.filename];
    if (oldId) {
      image.id = oldId;
    }
    return image;
  });

  json.images = fixedImageIds;

  return json;
};

export default loadProject;
