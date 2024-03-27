import { ImageIndexFunction } from "./indexedImage";

export type TileLookup = Record<string, Uint8Array>;

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
): number[] => {
  const output = new Array(tiles.length).fill(0);
  const keys = Object.keys(lookup);
  let i = 0;
  for (const tileData of tiles) {
    const key = hashTileData(tileData);
    let value = keys.indexOf(key);
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
