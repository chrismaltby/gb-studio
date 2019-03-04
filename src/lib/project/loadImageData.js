import fs from "fs-extra";
import path from "path";
import glob from "glob";
import { promisify } from "util";
import uuid from "uuid/v4";
import sizeOf from "image-size";

const TILE_SIZE = 8;

const globAsync = promisify(glob);
const sizeOfAsync = promisify(sizeOf);

const loadImageData = async filename => {
  const size = await sizeOfAsync(filename);
  const relativePath = filename.replace(/.*assets\/backgrounds\//, "");
  console.log({ relativePath });
  return {
    id: uuid(),
    name: relativePath.replace(".png", ""),
    width: size.width / TILE_SIZE,
    height: size.height / TILE_SIZE,
    filename: relativePath,
    _v: Date.now()
  };
};

const loadAllImageData = async projectRoot => {
  const imagePaths = await globAsync(
    projectRoot + "/assets/backgrounds/**/*.png"
  );
  console.log(imagePaths);
  const imageData = await Promise.all(imagePaths.map(loadImageData));
  return imageData;
};

export default loadAllImageData;
export { loadImageData };
