import { glob } from "lib/helpers/glob";
import { promisify } from "util";
import { v4 as uuid } from "uuid";
import { stat } from "fs";
import pngSize from "lib/helpers/pngSize";
import parseAssetPath from "shared/lib/assets/parseAssetPath";
import { toValidSymbol } from "shared/lib/helpers/symbols";
import { TILE_SIZE } from "consts";
import {
  CompressedTilesetResourceAsset,
  CompressedTilesetResource,
} from "shared/lib/resources/types";
import { getAssetResource } from "./assets";
const statAsync = promisify(stat);

const loadTilesetData =
  (projectRoot: string) =>
  async (filename: string): Promise<CompressedTilesetResourceAsset | null> => {
    const { file, plugin } = parseAssetPath(filename, projectRoot, "tilesets");

    const resource = await getAssetResource(
      CompressedTilesetResource,
      filename,
    );

    try {
      const size = await pngSize(filename);
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
        tileColors: "",
        tileCollisions: "",
        _v: Date.now(),
        ...resource,
        filename: file,
        imageWidth: width,
        imageHeight: height,
        inode,
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  };

const loadAllTilesetData = async (projectRoot: string) => {
  const imagePaths = await glob("assets/tilesets/**/@(*.png|*.PNG)", {
    cwd: projectRoot,
    absolute: true,
  });
  const pluginPaths = await glob("plugins/*/**/tilesets/**/@(*.png|*.PNG)", {
    cwd: projectRoot,
    absolute: true,
  });
  const imageData = (
    await Promise.all(
      ([] as Array<Promise<CompressedTilesetResourceAsset | null>>).concat(
        imagePaths.map(loadTilesetData(projectRoot)),
        pluginPaths.map(loadTilesetData(projectRoot)),
      ),
    )
  ).filter((i) => i) as CompressedTilesetResourceAsset[];
  return imageData;
};

export default loadAllTilesetData;
export { loadTilesetData };
