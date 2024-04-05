import { assetFilename } from "shared/lib/helpers/assets";
import { getBackgroundInfo } from "lib/helpers/validation";
import {
  tileArrayToTileData,
  tilesAndLookupToTilemap,
  toTileLookup,
} from "shared/lib/tiles/tileData";
import { readFileToTilesDataArray } from "lib/tiles/readFileToTiles";
import { BackgroundData } from "shared/lib/entities/entitiesTypes";
import promiseLimit from "lib/helpers/promiseLimit";
import { FLAG_VRAM_BANK_1 } from "consts";

const TILE_FIRST_CHUNK_SIZE = 128;
const TILE_BANK_SIZE = 192;

type PrecompiledBackgroundData = BackgroundData & {
  vramData: [number[], number[]];
  tilemap: number[];
  attr: number[];
};

type CompileImageOptions = {
  warnings: (msg: string) => void;
};

export type ImageTileAllocationStrategy = (
  tileIndex: number,
  numTiles: number,
  image: BackgroundData
) => { tileIndex: number; inVRAM2: boolean };

/**
 * Allocates an image tile for to default DMG location.
 *
 * @param {number} tileIndex - The index of the tile to allocate.
 * @param {number} numTiles - The total number of tiles available for allocation.
 * @returns {{ tileIndex: number, inVRAM2: boolean }} Updated tile index and flag which is set if tile has been reallocated to VRAM bank2.
 */
export const imageTileAllocationDefault: ImageTileAllocationStrategy = (
  tileIndex
) => {
  return {
    tileIndex,
    inVRAM2: false,
  };
};

/**
 * Allocates an image tile for color-only mode and adjusts the tile index based on VRAM bank allocation.
 *
 * @param {number} tileIndex - The index of the tile to allocate.
 * @param {number} numTiles - The total number of tiles available for allocation.
 * @returns {{ tileIndex: number, inVRAM2: boolean }} Updated tile index and flag which is set if tile has been reallocated to VRAM bank2.
 */
export const imageTileAllocationColorOnly: ImageTileAllocationStrategy = (
  tileIndex
) => {
  // First 128 tiles go into vram bank 1
  if (tileIndex < 128) {
    return {
      tileIndex,
      inVRAM2: false,
    };
    // Next 128 tiles go into vram bank 2
  } else if (tileIndex < 256) {
    return {
      tileIndex: tileIndex - 128,
      inVRAM2: true,
    };
  }
  // After that split evenly between bank 1 and 2
  return {
    tileIndex: 128 + Math.floor((tileIndex - 256) / 2),
    inVRAM2: tileIndex % 2 !== 0,
  };
};

const padArrayEnd = <T>(arr: T[], len: number, padding: T) => {
  if (arr.length > len) {
    return arr.slice(0, len);
  }
  return arr.concat(Array(len - arr.length).fill(padding));
};

const compileImage = async (
  img: BackgroundData,
  is360: boolean,
  cgbOnly: boolean,
  projectPath: string,
  { warnings }: CompileImageOptions
): Promise<PrecompiledBackgroundData> => {
  const filename = assetFilename(projectPath, "backgrounds", img);
  const tileData = await readFileToTilesDataArray(filename);

  if (is360) {
    const tilemap = Array.from(Array(360)).map((_, i) => i);
    const tiles = tileArrayToTileData(tileData);
    const attr = padArrayEnd(img.tileColors || [], tilemap.length, 0);
    return {
      ...img,
      vramData: [[...tiles], []],
      tilemap,
      attr,
    };
  }

  const tileAllocationStrategy = cgbOnly
    ? imageTileAllocationColorOnly
    : imageTileAllocationDefault;

  const tilesetLookup = toTileLookup(tileData) ?? {};
  const uniqueTiles = Object.values(tilesetLookup);
  const tilemap = tilesAndLookupToTilemap(tileData, tilesetLookup);

  const backgroundInfo = await getBackgroundInfo(
    img,
    false,
    cgbOnly,
    projectPath,
    uniqueTiles.length
  );
  const backgroundWarnings = backgroundInfo.warnings;
  if (backgroundWarnings.length > 0) {
    backgroundWarnings.forEach((warning) => {
      warnings(`${img.filename}: ${warning}`);
    });
  }

  const vramData: [number[], number[]] = [[], []];

  // Split tiles into VRAM banks based on allocation strategy
  uniqueTiles.forEach((tile, i, tiles) => {
    const { inVRAM2 } = tileAllocationStrategy(i, tiles.length, img);
    vramData[inVRAM2 ? 1 : 0].push(...tile);
  });

  // Determine tilemap attrs
  const attr = padArrayEnd(img.tileColors || [], tilemap.length, 0).map(
    (attr, index) => {
      const tile = tilemap[index];
      const { inVRAM2, tileIndex } = tileAllocationStrategy(
        tile,
        uniqueTiles.length,
        img
      );
      // Reallocate tilemap based on strategy
      if (tileIndex < TILE_FIRST_CHUNK_SIZE) {
        tilemap[index] = tileIndex;
      } else {
        // tile index > 128 is allocated with an unused tile offset
        // to allow as much tiles as possible for sprite data
        const bankSize = vramData[inVRAM2 ? 1 : 0].length / 16;
        const offset = TILE_BANK_SIZE - bankSize;
        tilemap[index] = tileIndex + offset;
      }
      if (inVRAM2) {
        return attr | FLAG_VRAM_BANK_1;
      }
      return attr;
    }
  );

  return {
    ...img,
    vramData,
    tilemap,
    attr,
  };
};

const compileImages = async (
  imgs: BackgroundData[],
  generate360Ids: string[],
  cgbOnly: boolean,
  projectPath: string,
  { warnings }: CompileImageOptions
): Promise<PrecompiledBackgroundData[]> => {
  return promiseLimit(
    10,
    imgs.map(
      (img) => () =>
        compileImage(
          img,
          generate360Ids.includes(img.id),
          cgbOnly,
          projectPath,
          { warnings }
        )
    )
  );
};

export default compileImages;
