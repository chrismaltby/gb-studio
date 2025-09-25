import glob from "glob";
import { promisify } from "util";
import uuidv4 from "uuid/v4";
import sizeOf from "image-size";
import { stat } from "fs";
import parseAssetPath from "shared/lib/assets/parseAssetPath";
import { checksumFile } from "lib/helpers/checksum";
import { toValidSymbol } from "shared/lib/helpers/symbols";
import {
  SpriteResource,
  SpriteResourceAsset,
} from "shared/lib/resources/types";
import { getAssetResource } from "./assets";

const globAsync = promisify(glob);
const sizeOfAsync = promisify(sizeOf);
const statAsync = promisify(stat);

const loadSpriteData =
  (projectRoot: string) =>
  async (filename: string): Promise<SpriteResourceAsset | null> => {
    const { file, plugin } = parseAssetPath(filename, projectRoot, "sprites");

    const resource = await getAssetResource(SpriteResource, filename);

    try {
      const size = await sizeOfAsync(filename);
      if (!size || !size.width || !size.height) {
        return null;
      }
      const fileStat = await statAsync(filename, { bigint: true });
      const inode = fileStat.ino.toString();
      const checksum = await checksumFile(filename);
      const name = file.replace(/.png/i, "");
      return {
        id: uuidv4(),
        plugin,
        name,
        symbol: toValidSymbol(`sprite_${name}`),
        states: [
          {
            id: uuidv4(),
            name: "",
            animationType: "multi_movement",
            flipLeft: true,
            animations: Array.from(Array(8)).map(() => ({
              id: uuidv4(),
              frames: [
                {
                  id: uuidv4(),
                  tiles: [],
                },
              ],
            })),
          },
        ],
        numTiles: 0,
        canvasOriginX: 0,
        canvasOriginY: 0,
        canvasWidth: 32,
        canvasHeight: 32,
        boundsX: 0,
        boundsY: -8,
        boundsWidth: 16,
        boundsHeight: 16,
        animSpeed: 15,
        _v: Date.now(),
        _resourceType: "sprite",
        ...resource,
        filename: file,
        width: size.width,
        height: size.height,
        inode,
        checksum,
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  };

const loadAllSpriteData = async (projectRoot: string) => {
  const spritePaths = await globAsync(
    `${projectRoot}/assets/sprites/**/@(*.png|*.PNG)`,
  );
  const pluginPaths = await globAsync(
    `${projectRoot}/plugins/*/**/sprites/**/@(*.png|*.PNG)`,
  );
  const spriteData = (
    await Promise.all(
      ([] as Promise<SpriteResourceAsset | null>[]).concat(
        spritePaths.map(loadSpriteData(projectRoot)),
        pluginPaths.map(loadSpriteData(projectRoot)),
      ),
    )
  ).filter((i) => i) as SpriteResourceAsset[];
  return spriteData;
};

export default loadAllSpriteData;
export { loadSpriteData };
