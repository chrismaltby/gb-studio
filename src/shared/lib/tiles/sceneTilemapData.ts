import { SceneTilemapData } from "shared/lib/resources/types";

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

export interface SceneTilesetLookup {
  entries: SceneTilesetIndexEntry[];
  entryByTilesetId: Map<string, SceneTilesetIndexEntry>;
  entryByAbsoluteIndex: Array<SceneTilesetIndexEntry | undefined>;
}

export const getSceneTilesetOffset = (
  tilemap: Pick<SceneTilemapData, "tilesets">,
  tilesetId: string,
): number | undefined =>
  buildSceneTilesetIndex(tilemap).find((entry) => entry.tilesetId === tilesetId)
    ?.offset;

export const buildSceneTilesetIndex = (
  tilemap: Pick<SceneTilemapData, "tilesets">,
): SceneTilesetIndexEntry[] => {
  let offset = 0;

  return tilemap.tilesets.map((tileset, tilesetIndex) => {
    const tilesetId = tileset.id;
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

export const buildSceneTilesetLookup = (
  tilemap: Pick<SceneTilemapData, "tilesets">,
): SceneTilesetLookup => {
  const entries = buildSceneTilesetIndex(tilemap);
  const entryByTilesetId = new Map<string, SceneTilesetIndexEntry>();
  const entryByAbsoluteIndex: Array<SceneTilesetIndexEntry | undefined> = [];

  for (const entry of entries) {
    if (!entryByTilesetId.has(entry.tilesetId)) {
      entryByTilesetId.set(entry.tilesetId, entry);
    }

    for (let i = 0; i < entry.count; i++) {
      entryByAbsoluteIndex[entry.offset + i] = entry;
    }
  }

  return {
    entries,
    entryByTilesetId,
    entryByAbsoluteIndex,
  };
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

export const decodeSceneTileRefFromLookup = (
  value: number,
  lookup: SceneTilesetLookup,
): DecodedSceneTileRef | undefined => {
  if (!value) {
    return undefined;
  }

  const absoluteIndex = value - 1;
  const entry = lookup.entryByAbsoluteIndex[absoluteIndex];

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

export const pruneTilemapLayersTilesets = (
  tilemap: SceneTilemapData,
): SceneTilemapData => {
  const usedTilesetIds = new Set<string>();
  const tilesetLookup = buildSceneTilesetLookup(tilemap);

  // Find tilesets that are still being referenced
  for (const layer of tilemap.layers) {
    for (const value of layer.tiles) {
      const ref = decodeSceneTileRefFromLookup(value, tilesetLookup);
      if (ref?.tilesetId) {
        usedTilesetIds.add(ref.tilesetId);
      }
    }

    for (const value of layer.autotiles ?? []) {
      const ref = decodeSceneTileRefFromLookup(value, tilesetLookup);
      if (ref?.tilesetId) {
        usedTilesetIds.add(ref.tilesetId);
      }
    }
  }

  // Keep only tilesets that are still referenced
  const seenTilesetIds = new Set<string>();
  const tilesets = tilemap.tilesets.filter((tileset) => {
    if (!usedTilesetIds.has(tileset.id) || seenTilesetIds.has(tileset.id)) {
      return false;
    }
    seenTilesetIds.add(tileset.id);
    return true;
  });

  const nextTilemap = {
    ...tilemap,
    tilesets,
  };

  // Remap layers to use the compacted tilesets
  const nextLookup = buildSceneTilesetLookup(nextTilemap);

  const remapRef = (value: number) => {
    const ref = decodeSceneTileRefFromLookup(value, tilesetLookup);
    if (!ref?.tilesetId) {
      return 0;
    }

    const newEntry = nextLookup.entryByTilesetId.get(ref.tilesetId);
    return newEntry ? encodeSceneTileRef(newEntry.offset, ref.tileIndex) : 0;
  };

  return {
    ...nextTilemap,
    layers: tilemap.layers.map((layer) => ({
      ...layer,
      tiles: layer.tiles.map(remapRef),
      autotiles: layer.autotiles?.map(remapRef),
    })),
  };
};
