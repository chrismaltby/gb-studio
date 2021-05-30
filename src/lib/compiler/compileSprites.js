import promiseLimit from "../helpers/promiseLimit";
import { assetFilename } from "../helpers/gbstudio";
import getFileModifiedTime from "../helpers/fs/getModifiedTime";

const ggbgfx = require("./ggbgfx");

const spriteBuildCache = {};

const compileSprites = async (spriteSheets, projectRoot, { warnings }) => {
  const spriteData = await promiseLimit(
    10,
    spriteSheets.map((spriteSheet) => {
      return async () => {
        const filename =  assetFilename(projectRoot, "sprites", spriteSheet);
        const modifiedTime = await getFileModifiedTime(filename);
        let data;

        if(spriteBuildCache[spriteSheet.id] && spriteBuildCache[spriteSheet.id].timestamp >= modifiedTime) {
          data = spriteBuildCache[spriteSheet.id].data;
        } else {
            data = await ggbgfx.imageToSpriteIntArray(filename);
            spriteBuildCache[spriteSheet.id] = {
            data,
            timestamp: modifiedTime
          }
        }

        const size = data.length;
        const frames = Math.ceil(size / 64);
        if (Math.ceil(size / 64) !== Math.floor(size / 64)) {
          warnings(
            `Sprite '${spriteSheet.filename}' has invalid dimensions and may not appear correctly. Must be 16px tall and a multiple of 16px wide.`
          );
        }

        return {
          ...spriteSheet,
          data,
          size,
          frames,
        };
      };
    })
  );

  return spriteData;
};

export default compileSprites;
