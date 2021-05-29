import {
  ImageIndexFunction,
  indexedImageTo2bppTileData,
  readFileToIndexedImage,
  sliceIndexedImage,
} from "./indexedImage";

type TileLookup = Record<string, Uint8Array>;

const TILE_SIZE = 8;

export const tileDataIndexFn: ImageIndexFunction = (_r, g, _b, _a) => {
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

const TILE_FIRST_CHUNK_SIZE = 128;
const TILE_SECOND_CHUNK_END = 192;

export const tilesAndLookupToTilemap = (
  tiles: Uint8Array[],
  lookup: TileLookup
): Uint8Array => {
  const output = new Uint8Array(tiles.length);
  const keys = Object.keys(lookup);
  let i = 0;
  // If num tiles > 128 and < 192 allocate in two chunks to give more tiles to sprites
  const secondChunkSize =
    keys.length > TILE_FIRST_CHUNK_SIZE && keys.length <= TILE_SECOND_CHUNK_END
      ? TILE_SECOND_CHUNK_END - (keys.length - TILE_FIRST_CHUNK_SIZE)
      : 0;

  for (const tileData of tiles) {
    const key = hashTileData(tileData);
    let value = keys.indexOf(key);
    if (value === -1) {
      throw new Error("Missing Tile" + key);
    }
    // Reallocate if using a realigned second chunk
    if (secondChunkSize > 0 && value >= TILE_FIRST_CHUNK_SIZE) {
      value = secondChunkSize + (value - TILE_FIRST_CHUNK_SIZE);
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
