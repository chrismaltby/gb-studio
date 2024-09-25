import glob from "glob";
import { promisify } from "util";
import uuid from "uuid/v4";
import sizeOf from "image-size";
import { stat } from "fs";
import parseAssetPath from "shared/lib/assets/parseAssetPath";
import { toValidSymbol } from "shared/lib/helpers/symbols";
import { TILE_SIZE } from "consts";

const globAsync = promisify(glob);
const sizeOfAsync = promisify(sizeOf);
const statAsync = promisify(stat);

export interface BackgroundAssetData {
  id: string;
  name: string;
  symbol: string;
  filename: string;
  width: number;
  height: number;
  imageWidth: number;
  imageHeight: number;
  plugin?: string;
  inode: string;
  _v: number;
}

const loadBackgroundData =
  (projectRoot: string) =>
  async (filename: string): Promise<BackgroundAssetData | null> => {
    const { file, plugin } = parseAssetPath(
      filename,
      projectRoot,
      "backgrounds"
    );
    try {
      const size = await sizeOfAsync(filename);
      const fileStat = await statAsync(filename, { bigint: true });
      const inode = fileStat.ino.toString();
      const name = file.replace(/.png/i, "");
      const width = size?.width ?? 160;
      const height = size?.height ?? 144;
      return {
        id: uuid(),
        plugin,
        name,
        symbol: toValidSymbol(`bg_${name}`),
        width: Math.min(Math.floor(width / TILE_SIZE), 255),
        height: Math.min(Math.floor(height / TILE_SIZE), 255),
        imageWidth: width,
        imageHeight: height,
        filename: file,
        inode,
        _v: Date.now(),
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  };

const loadAllBackgroundData = async (projectRoot: string) => {
  const imagePaths = await globAsync(
    `${projectRoot}/assets/backgrounds/**/@(*.png|*.PNG)`
  );
  const pluginPaths = await globAsync(
    `${projectRoot}/plugins/**/backgrounds/**/@(*.png|*.PNG)`
  );
  const imageData = (
    await Promise.all(
      ([] as Array<Promise<BackgroundAssetData | null>>).concat(
        imagePaths.map(loadBackgroundData(projectRoot)),
        pluginPaths.map(loadBackgroundData(projectRoot))
      )
    )
  ).filter((i) => i) as BackgroundAssetData[];
  return imageData;
};

export default loadAllBackgroundData;
export { loadBackgroundData };
