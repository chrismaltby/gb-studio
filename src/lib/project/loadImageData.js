import fs from "fs-extra";
import path from "path";
import glob from "glob";
import { promisify } from "util";
import uuid from "uuid/v4";
import sizeOf from "image-size";

const TILE_SIZE = 8;

const globAsync = promisify(glob);
const sizeOfAsync = promisify(sizeOf);

const loadImageData = async projectRoot => {
  const imagePaths = await globAsync(projectRoot + "/assets/backgrounds/*.png");

  const imageData = await Promise.all(
    imagePaths.map(async file => {
      const size = await sizeOfAsync(file);
      return {
        id: uuid(),
        name: path.basename(file, ".png").replace(/_/g, " "),
        width: size.width / TILE_SIZE,
        height: size.height / TILE_SIZE,
        filename: path.basename(file)
      };
    })
  );

  return imageData;
};

export default loadImageData;
