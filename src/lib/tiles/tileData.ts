import {
  ImageIndexFunction,
  indexedImageTo2bppTileData,
  readFileToIndexedImage,
  sliceIndexedImage,
} from "./indexedImage";

type TileLookup = Record<string, Uint8Array>;

const TILE_SIZE = 8;
const MAX_TILEMAP_TILE_WIDTH = 16;
const MAX_TILEMAP_WIDTH = TILE_SIZE * MAX_TILEMAP_TILE_WIDTH;

export const tileDataIndexFn: ImageIndexFunction = (r, g, b, a) => {
  if (g < 65) {
    return 3;
  }
  if (g < 130) {
    return 2;
  }
  if (g < 205) {
    return 1;
  }
  return 0;
};

/**
 * Read an image filename into a GB 2bpp data array
 * @param filename Tiles image filename
 * @returns Uint8Array of 2bpp tile data
 */
export const readFileToTilesData = async (
  filename: string
): Promise<Uint8Array> => {
  const img = await readFileToIndexedImage(filename, tileDataIndexFn);
  const xTiles = Math.floor(img.width / TILE_SIZE);
  const yTiles = Math.floor(img.height / TILE_SIZE);
  const size = xTiles * yTiles * 16;
  const output = new Uint8Array(size);
  let index = 0;
  for (let tyi = 0; tyi < yTiles; tyi++) {
    for (let txi = 0; txi < xTiles; txi++) {
      const tileData = indexedImageTo2bppTileData(
        sliceIndexedImage(
          img,
          txi * TILE_SIZE,
          tyi * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE
        )
      );
      output.set(tileData, index);
      index += tileData.length;
    }
  }
  return output;
};

/**
 * Read an image filename into an array of GB 2bpp data array (one array per tile)
 * @param filename Tiles image filename
 * @returns Array of Uint8Array of 2bpp tile data
 */
export const readFileToTilesDataArray = async (
  filename: string
): Promise<Uint8Array[]> => {
  const img = await readFileToIndexedImage(filename, tileDataIndexFn);
  const xTiles = Math.floor(img.width / TILE_SIZE);
  const yTiles = Math.floor(img.height / TILE_SIZE);
  const output = [];
  for (let tyi = 0; tyi < yTiles; tyi++) {
    for (let txi = 0; txi < xTiles; txi++) {
      const tileData = indexedImageTo2bppTileData(
        sliceIndexedImage(
          img,
          txi * TILE_SIZE,
          tyi * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE
        )
      );
      output.push(tileData);
    }
  }
  return output;
};

export const toTileLookup = (tiles: Uint8Array[]): TileLookup => {
  const output: TileLookup = {};

  for (const tile of tiles) {
    const key = hashTileData(tile);
    if (!output[key]) {
      output[key] = tile;
    }
  }

  return output;
};

export const mergeTileLookups = (tileLookups: TileLookup[]): TileLookup => {
  const output: TileLookup = {};
  for (const lookup of tileLookups) {
    for (const key in lookup) {
      output[key] = lookup[key];
    }
  }
  return output;
};

export const tileLookupToTileData = (lookup: TileLookup): Uint8Array => {
  return tileArrayToTileData(Object.values(lookup));
};

export const tileArrayToTileData = (tiles: Uint8Array[]): Uint8Array => {
  const size = tiles.reduce((memo, tile) => memo + tile.length, 0);
  const output = new Uint8Array(size);
  let index = 0;
  for (const tileData of tiles) {
    output.set(tileData, index);
    index += tileData.length;
  }
  return output;
};

export const tilesAndLookupToTilemap = (
  tiles: Uint8Array[],
  lookup: TileLookup
): Uint8Array => {
  const output = new Uint8Array(tiles.length);
  const keys = Object.keys(lookup);
  let i = 0;
  for (const tileData of tiles) {
    const key = hashTileData(tileData);
    const value = keys.indexOf(key);
    if (value === -1) {
      throw new Error("Missing Tile" + key);
    }
    output[i] = value;
    i++;
  }
  return output;
};

export const hashTileData = (tile: Uint8Array): string => {
  // Will do for now...
  return JSON.stringify(tile);
};
