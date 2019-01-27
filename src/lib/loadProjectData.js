import fs from "fs-extra";
import loadImageData from "./loadImageData";

const loadProject = async path => {
  const json = await fs.readJson(path + "/project.json");

  const backgrounds = await loadImageData(path);

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
