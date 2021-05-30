import promiseLimit from "../helpers/promiseLimit";
import { assetFilename } from "../helpers/gbstudio";
import getFileModifiedTime from "../helpers/fs/getModifiedTime";

const ggbgfx = require("./ggbgfx");

const avatarBuildCache = {};

const compileAvatars = async (avatars, projectRoot, { warnings }) => {
  const avatarData = await promiseLimit(
    10,
    avatars.map((spriteSheet) => {
      return async () => {
        const filename =  assetFilename(projectRoot, "sprites", spriteSheet);
        const modifiedTime = await getFileModifiedTime(filename);
        let data;

        if(avatarBuildCache[spriteSheet.id] && avatarBuildCache[spriteSheet.id].timestamp >= modifiedTime) {
          data = avatarBuildCache[spriteSheet.id].data;
        } else {
            data = await ggbgfx.imageToTilesDataIntArray(filename);
            avatarBuildCache[spriteSheet.id] = {
            data,
            timestamp: modifiedTime
          }
        }

        const size = data.length;
        const frames = Math.ceil(size / 64);
        if (Math.ceil(size / 64) !== Math.floor(size / 64)) {
          warnings(
            `Avatar '${spriteSheet.filename}' has invalid dimensions and may not appear correctly. Must be 16px tall and a multiple of 16px wide.`
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

  return avatarData;
};

export default compileAvatars;
