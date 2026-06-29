import { SceneTilemapData } from "shared/lib/resources/types";

export interface SceneTilesetLike {
  id: string;
  width: number;
  height: number;
}

export type SceneTilesetLookup = Record<string, SceneTilesetLike | undefined>;

export interface SceneTilesetIndexEntry {
  tilesetId: string;
  tilesetIndex: number;
  width: number;
  height: number;
  offset: number;
  count: number;
}

export interface DecodedSceneTileRef {
  absoluteIndex: number;
  tilesetIndex: number;
  tileIndex: number;
  tilesetId: string;
  tilesetOffset: number;
}

export interface DecodedSceneAutotileRef extends DecodedSceneTileRef {
  tilesetWidth: number;
}

export const getSceneTilesetOffset = (
  tilemap: Pick<SceneTilemapData, "tilesetIds">,
  tilesets: SceneTilesetLookup,
  tilesetId: string,
): number | undefined =>
  buildSceneTilesetIndex(tilemap, tilesets).find(
    (entry) => entry.tilesetId === tilesetId,
  )?.offset;

export const buildSceneTilesetIndex = (
  tilemap: Pick<SceneTilemapData, "tilesetIds">,
  tilesets: SceneTilesetLookup,
): SceneTilesetIndexEntry[] => {
  let offset = 0;

  return tilemap.tilesetIds.map((tilesetId, tilesetIndex) => {
    const tileset = tilesets[tilesetId];
    const width = Math.max(0, Math.floor(tileset?.width ?? 0));
    const height = Math.max(0, Math.floor(tileset?.height ?? 0));
    const count = width * height;

    const entry = {
      tilesetId,
      tilesetIndex,
      width,
      height,
      offset,
      count,
    };

    offset += count;
    return entry;
  });
};

export const findSceneTilesetByAbsoluteIndex = (
  indexEntries: SceneTilesetIndexEntry[],
  absoluteIndex: number,
): SceneTilesetIndexEntry | undefined => {
  return indexEntries.find(
    (entry) =>
      absoluteIndex >= entry.offset &&
      absoluteIndex < entry.offset + entry.count,
  );
};

export const encodeSceneTileRef = (
  tilesetOffset: number,
  tileIndex = 0,
): number => {
  return tilesetOffset + tileIndex + 1;
};

export const decodeSceneTileRef = (
  value: number,
  indexEntries: SceneTilesetIndexEntry[],
): DecodedSceneTileRef | undefined => {
  if (!value) {
    return undefined;
  }

  const absoluteIndex = value - 1;
  const entry = findSceneTilesetByAbsoluteIndex(indexEntries, absoluteIndex);

  if (!entry) {
    return undefined;
  }

  return {
    absoluteIndex,
    tilesetIndex: entry.tilesetIndex,
    tileIndex: absoluteIndex - entry.offset,
    tilesetId: entry.tilesetId,
    tilesetOffset: entry.offset,
  };
};

export const encodeSceneAutotileRef = encodeSceneTileRef;

export const decodeSceneAutotileRef = (
  value: number,
  indexEntries: SceneTilesetIndexEntry[],
): DecodedSceneAutotileRef | undefined => {
  const ref = decodeSceneTileRef(value, indexEntries);

  if (!ref) {
    return undefined;
  }

  const entry = indexEntries[ref.tilesetIndex];

  return {
    ...ref,
    tilesetWidth: Math.max(1, Math.floor(entry?.width ?? 4)),
  };
};

export const getTilemapLayersTileColors = (
  tilemap: SceneTilemapData,
  width: number,
  height: number,
): number[] => {
  const size = width * height;
  const tileColors = tilemap.tileColors ?? [];
  return tileColors
    .slice(0, size)
    .concat(new Array(Math.max(0, size - tileColors.length)).fill(0));
};

export const flattenTilemapLayers = (
  tilemap: SceneTilemapData,
  width: number,
  height: number,
): number[] => {
  const size = width * height;
  const tiles = new Array<number>(size).fill(0);
  for (const layer of tilemap.layers) {
    if (!layer.visible) {
      continue;
    }
    for (let i = 0; i < size; i++) {
      const tile = layer.tiles[i];
      if (tile) {
        tiles[i] = tile;
      }
    }
  }
  return tiles;
};
