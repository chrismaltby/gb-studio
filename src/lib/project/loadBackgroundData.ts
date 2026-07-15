import { glob } from "lib/helpers/glob";
import { promisify } from "util";
import { v4 as uuid } from "uuid";
import { stat } from "fs";
import pngSize from "lib/helpers/pngSize";
import parseAssetPath from "shared/lib/assets/parseAssetPath";
import { toValidSymbol } from "shared/lib/helpers/symbols";
import { TILE_SIZE } from "consts";
import {
  CompressedBackgroundResource,
  CompressedBackgroundResourceAsset,
} from "shared/lib/resources/types";
import { getAssetResource } from "./assets";
const statAsync = promisify(stat);

const loadBackgroundData =
  (projectRoot: string) =>
  async (
    filename: string,
  ): Promise<CompressedBackgroundResourceAsset | null> => {
    const { file, plugin } = parseAssetPath(
      filename,
      projectRoot,
      "backgrounds",
    );

    const resource = await getAssetResource(
      CompressedBackgroundResource,
      filename,
    );

    try {
      const size = await pngSize(filename);
      const fileStat = await statAsync(filename, { bigint: true });
      const inode = fileStat.ino.toString();
      const name = file.replace(/.png/i, "");
      const imageWidth = size?.width ?? 160;
      const imageHeight = size?.height ?? 144;
      const tileWidth = Math.min(Math.floor(imageWidth / TILE_SIZE), 255);
      const tileHeight = Math.min(Math.floor(imageHeight / TILE_SIZE), 255);
      return {
        _resourceType: "background",
        id: uuid(),
        plugin,
        name,
        symbol: toValidSymbol(`bg_${name}`),
        _v: Date.now(),
        tileColors: "",
        ...resource,
        filename: file,
        width: tileWidth,
        height: tileHeight,
        imageWidth,
        imageHeight,
        inode,
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  };

const loadAllBackgroundData = async (projectRoot: string) => {
  const imagePaths = await glob("assets/backgrounds/**/@(*.png|*.PNG)", {
    cwd: projectRoot,
    absolute: true,
  });
  const pluginPaths = await glob("plugins/*/**/backgrounds/**/@(*.png|*.PNG)", {
    cwd: projectRoot,
    absolute: true,
  });
  const imageData = (
    await Promise.all(
      ([] as Array<Promise<CompressedBackgroundResourceAsset | null>>).concat(
        imagePaths.map(loadBackgroundData(projectRoot)),
        pluginPaths.map(loadBackgroundData(projectRoot)),
      ),
    )
  ).filter((i) => i) as CompressedBackgroundResourceAsset[];
  return imageData;
};

export default loadAllBackgroundData;
export { loadBackgroundData };
