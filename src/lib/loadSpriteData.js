import fs from "fs-extra";
import path from "path";
import glob from "glob";
import { promisify } from "util";
import uuidv4 from "uuid/v4";
import sizeOf from "image-size";

const FRAME_SIZE = 16;

const globAsync = promisify(glob);
const sizeOfAsync = promisify(sizeOf);

const loadSpriteData = async projectRoot => {
  const spritePaths = await globAsync(projectRoot + "/assets/sprites/*.png");

  const spriteData = await Promise.all(
    spritePaths.map(async file => {
      const size = await sizeOfAsync(file);
      const numFrames = size.width / FRAME_SIZE;

      return {
        id: uuidv4(),
        name: path.basename(file, ".png").replace(/_/g, " "),
        numFrames,
        type:
          numFrames === 6
            ? "actor_animated"
            : numFrames === 3
            ? "actor"
            : numFrames === 1
            ? "static"
            : "invalid",
        filename: path.basename(file)
      };
    })
  );

  return spriteData;
};

export default loadSpriteData;
