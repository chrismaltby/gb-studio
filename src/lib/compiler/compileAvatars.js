import promiseLimit from "lib/helpers/promiseLimit";
import getFileModifiedTime from "lib/helpers/fs/getModifiedTime";
import { assetFilename } from "shared/lib/helpers/assets";
import { readFileToTilesData } from "lib/tiles/readFileToTiles";

const avatarBuildCache = {};

const compileAvatars = async (avatars, projectRoot, { warnings }) => {
  const avatarData = await promiseLimit(
    10,
    avatars.map((avatar) => {
      return async () => {
        const filename = assetFilename(projectRoot, "avatars", avatar);
        const modifiedTime = await getFileModifiedTime(filename);
        let data;

        if (
          avatarBuildCache[avatar.id] &&
          avatarBuildCache[avatar.id].timestamp >= modifiedTime
        ) {
          data = avatarBuildCache[avatar.id].data;
        } else {
          data = await readFileToTilesData(filename);
          avatarBuildCache[avatar.id] = {
            data,
            timestamp: modifiedTime,
          };
        }

        const size = data.length;
        const frames = Math.ceil(size / 64);
        if (Math.ceil(size / 64) !== Math.floor(size / 64)) {
          warnings(
            `Avatar '${avatar.filename}' has invalid dimensions and may not appear correctly. Must be 16px tall and a multiple of 16px wide.`
          );
        }

        return {
          ...avatar,
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
