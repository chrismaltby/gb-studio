import glob from "glob";
import { promisify } from "util";
import uuid from "uuid/v4";
import sizeOf from "image-size";
import { stat } from "fs";
import parseAssetPath from "shared/lib/assets/parseAssetPath";
import { toValidSymbol } from "shared/lib/helpers/symbols";
import { TILE_SIZE } from "consts";
import {
  TilesetResource,
  TilesetResourceAsset,
} from "shared/lib/resources/types";
import { getAssetResource } from "./assets";

const globAsync = promisify(glob);
const sizeOfAsync = promisify(sizeOf);
const statAsync = promisify(stat);

const loadTilesetData =
  (projectRoot: string) =>
  async (filename: string): Promise<TilesetResourceAsset | null> => {
    const { file, plugin } = parseAssetPath(filename, projectRoot, "tilesets");

    const resource = await getAssetResource(TilesetResource, filename);

    try {
      const size = await sizeOfAsync(filename);
      const fileStat = await statAsync(filename, { bigint: true });
      const inode = fileStat.ino.toString();
      const name = file.replace(/.png/i, "");
      const width = size?.width ?? 160;
      const height = size?.height ?? 144;
      return {
        _resourceType: "tileset",
        id: uuid(),
        plugin,
        name,
        symbol: toValidSymbol(`tileset_${name}`),
        width: Math.min(Math.floor(width / TILE_SIZE), 255),
        height: Math.min(Math.floor(height / TILE_SIZE), 255),
        imageWidth: width,
        imageHeight: height,
        _v: Date.now(),
        ...resource,
        filename: file,
        inode,
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  };

const loadAllTilesetData = async (projectRoot: string) => {
  const imagePaths = await globAsync(
    `${projectRoot}/assets/tilesets/**/@(*.png|*.PNG)`
  );
  const pluginPaths = await globAsync(
    `${projectRoot}/plugins/*/**/tilesets/**/@(*.png|*.PNG)`
  );
  const imageData = (
    await Promise.all(
      ([] as Array<Promise<TilesetResourceAsset | null>>).concat(
        imagePaths.map(loadTilesetData(projectRoot)),
        pluginPaths.map(loadTilesetData(projectRoot))
      )
    )
  ).filter((i) => i) as TilesetResourceAsset[];
  return imageData;
};

export default loadAllTilesetData;
export { loadTilesetData };
