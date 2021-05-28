import glob from "glob";
import { promisify } from "util";
import uuid from "uuid/v4";
import sizeOf from "image-size";
import { stat } from "fs-extra";
import parseAssetPath from "../helpers/path/parseAssetPath";

const TILE_SIZE = 8;

const globAsync = promisify(glob);
const sizeOfAsync = promisify(sizeOf);

const loadBackgroundData = (projectRoot) => async (filename) => {
  const { file, plugin } = parseAssetPath(filename, projectRoot, "backgrounds");
  try {
    const size = await sizeOfAsync(filename);
    const fileStat = await stat(filename, { bigint: true });
    const inode = fileStat.ino.toString();
    return {
      id: uuid(),
      plugin,
      name: file.replace(/.png/i, ""),
      width: Math.min(Math.floor(size.width / TILE_SIZE), 255),
      height: Math.min(Math.floor(size.height / TILE_SIZE), 255),
      imageWidth: size.width,
      imageHeight: size.height,
      filename: file,
      inode,
      _v: Date.now(),
    };
  } catch (e) {
    console.error(e);
    return null;
  }
};

const loadAllBackgroundData = async (projectRoot) => {
  const imagePaths = await globAsync(
    `${projectRoot}/assets/backgrounds/**/@(*.png|*.PNG)`
  );
  const pluginPaths = await globAsync(
    `${projectRoot}/plugins/*/backgrounds/**/@(*.png|*.PNG)`
  );
  const imageData = (
    await Promise.all(
      [].concat(
        imagePaths.map(loadBackgroundData(projectRoot)),
        pluginPaths.map(loadBackgroundData(projectRoot))
      )
    )
  ).filter((i) => i);
  return imageData;
};

export default loadAllBackgroundData;
export { loadBackgroundData };
