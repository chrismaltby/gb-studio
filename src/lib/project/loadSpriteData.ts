import glob from "glob";
import { promisify } from "util";
import uuidv4 from "uuid/v4";
import sizeOf from "image-size";
import { stat } from "fs";
import parseAssetPath from "shared/lib/assets/parseAssetPath";
import { checksumFile } from "lib/helpers/checksum";
import { toValidSymbol } from "shared/lib/helpers/symbols";

const FRAME_SIZE = 16;

const globAsync = promisify(glob);
const sizeOfAsync = promisify(sizeOf);
const statAsync = promisify(stat);

export interface SpriteAssetData {
  id: string;
  name: string;
  symbol: string;
  filename: string;
  numTiles: number;
  plugin?: string;
  inode: string;
  checksum: string;
  _v: number;
  width: number;
  height: number;
  canvasWidth: number;
  canvasHeight: number;
  boundsX: number;
  boundsY: number;
  boundsWidth: number;
  boundsHeight: number;
  animSpeed: number | null;
  states: string[];
  numFrames: number;
}

const loadSpriteData =
  (projectRoot: string) =>
  async (filename: string): Promise<SpriteAssetData | null> => {
    const { file, plugin } = parseAssetPath(filename, projectRoot, "sprites");
    try {
      const size = await sizeOfAsync(filename);
      if (!size || !size.width || !size.height) {
        return null;
      }
      const fileStat = await statAsync(filename, { bigint: true });
      const inode = fileStat.ino.toString();
      const checksum = await checksumFile(filename);
      const numFrames = size.width / FRAME_SIZE; // @TODO can this be removed now?
      const name = file.replace(/.png/i, "");
      return {
        id: uuidv4(),
        plugin,
        name,
        symbol: toValidSymbol(`sprite_${name}`),
        numFrames,
        filename: file,
        inode,
        checksum,
        width: size.width,
        height: size.height,
        states: [],
        numTiles: 0,
        canvasWidth: 32,
        canvasHeight: 32,
        boundsX: 0,
        boundsY: 0,
        boundsWidth: 16,
        boundsHeight: 16,
        animSpeed: 15,
        _v: Date.now(),
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  };

const loadAllSpriteData = async (projectRoot: string) => {
  const spritePaths = await globAsync(
    `${projectRoot}/assets/sprites/**/@(*.png|*.PNG)`
  );
  const pluginPaths = await globAsync(
    `${projectRoot}/plugins/**/sprites/**/@(*.png|*.PNG)`
  );
  const spriteData = (
    await Promise.all(
      ([] as Promise<SpriteAssetData | null>[]).concat(
        spritePaths.map(loadSpriteData(projectRoot)),
        pluginPaths.map(loadSpriteData(projectRoot))
      )
    )
  ).filter((i) => i) as SpriteAssetData[];
  return spriteData;
};

export default loadAllSpriteData;
export { loadSpriteData };
