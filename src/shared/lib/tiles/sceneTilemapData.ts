import {
  SceneTilemapLayer,
  SceneTilemapData,
} from "shared/lib/resources/types";
import {
  clearGridSelection,
  moveGridSelection,
  type GridOffset,
  type GridSelection,
} from "./gridSelection";

export const moveTilemapLayerSelection = (
  layer: SceneTilemapLayer,
  sceneWidth: number,
  sceneHeight: number,
  selection: GridSelection,
  offset: GridOffset,
): SceneTilemapLayer => {
  const tiles = moveGridSelection(
    layer.tiles,
    sceneWidth,
    sceneHeight,
    selection,
    offset,
    0,
  );
  const autotiles = layer.autotiles
    ? moveGridSelection(
        layer.autotiles,
        sceneWidth,
        sceneHeight,
        selection,
        offset,
        0,
      )
    : undefined;

  return {
    ...layer,
    tiles,
    ...(autotiles ? { autotiles } : {}),
  };
};

export const clearTilemapLayerSelection = (
  layer: SceneTilemapLayer,
  sceneWidth: number,
  sceneHeight: number,
  selection: GridSelection,
): SceneTilemapLayer => {
  const tiles = clearGridSelection(
    layer.tiles,
    sceneWidth,
    sceneHeight,
    selection,
    0,
  );
  const autotiles = layer.autotiles
    ? clearGridSelection(layer.autotiles, sceneWidth, sceneHeight, selection, 0)
    : undefined;
  return {
    ...layer,
    tiles,
    ...(autotiles ? { autotiles } : {}),
  };
};

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

// The 16 possible 2x2 autotile shapes. Bits run clockwise around the corners:
// NW, NE, SE, SW. Variants are stored in a 4x4 block in this stable order,
// starting at the tile selected in the palette.
export const AUTOTILE_VARIANT_MASKS: readonly number[] = [
  8, 6, 13, 12, 5, 14, 15, 11, 2, 3, 7, 9, 0, 4, 10, 1,
];

const AUTOTILE_MASK_TO_VARIANT = AUTOTILE_VARIANT_MASKS.reduce(
  (memo, mask, variant) => {
    memo[mask] = variant;
    return memo;
  },
  new Array<number>(16).fill(-1),
);

type ResolvedAutotileSource = {
  absoluteIndex: number;
  tilesetOffset: number;
  tileIndex: number;
  tilesetWidth: number;
};

export const resolveSceneAutotiles = (
  autotiles: readonly number[],
  width: number,
  height: number,
  tilemap: Pick<SceneTilemapData, "tilesets">,
): number[] => {
  const size = width * height;
  const tilesetLookup = buildSceneTilesetLookup(tilemap);

  const autotileSources = new Array<ResolvedAutotileSource | undefined>(size);

  for (let index = 0; index < size; index++) {
    const ref = decodeSceneTileRef(autotiles[index] ?? 0, tilesetLookup);

    if (!ref) {
      continue;
    }

    const tilesetWidth = tilesetLookup.entries[ref.tilesetIndex]?.width;

    if (!tilesetWidth) {
      continue;
    }

    autotileSources[index] = {
      absoluteIndex: ref.absoluteIndex,
      tilesetOffset: ref.tilesetOffset,
      tileIndex: ref.tileIndex,
      tilesetWidth,
    };
  }

  const connected = (
    source: ResolvedAutotileSource,
    x: number,
    y: number,
    offsetX: number,
    offsetY: number,
  ) => {
    const neighbourX = x + offsetX;
    const neighbourY = y + offsetY;

    if (
      neighbourX < 0 ||
      neighbourY < 0 ||
      neighbourX >= width ||
      neighbourY >= height
    ) {
      return true;
    }

    return (
      autotileSources[neighbourY * width + neighbourX]?.absoluteIndex ===
      source.absoluteIndex
    );
  };

  const resolved = new Array<number>(size).fill(0);

  for (let index = 0; index < size; index++) {
    const source = autotileSources[index];

    if (!source) {
      continue;
    }

    const x = index % width;
    const y = Math.floor(index / width);

    const north = connected(source, x, y, 0, -1);
    const east = connected(source, x, y, 1, 0);
    const south = connected(source, x, y, 0, 1);
    const west = connected(source, x, y, -1, 0);

    let mask = 0;
    if (north && west && connected(source, x, y, -1, -1)) mask |= 1;
    if (north && east && connected(source, x, y, 1, -1)) mask |= 2;
    if (south && east && connected(source, x, y, 1, 1)) mask |= 4;
    if (south && west && connected(source, x, y, -1, 1)) mask |= 8;

    const variant = AUTOTILE_MASK_TO_VARIANT[mask] ?? -1;

    if (variant >= 0) {
      resolved[index] = encodeSceneTileRef(
        source.tilesetOffset,
        source.tileIndex +
          (variant % 4) +
          Math.floor(variant / 4) * source.tilesetWidth,
      );
    }
  }

  return resolved;
};

export const buildSceneTilesetLookup = (
  tilemap: Pick<SceneTilemapData, "tilesets">,
): SceneTilesetLookup => {
  let offset = 0;
  const entries: SceneTilesetIndexEntry[] = [];
  const entryByTilesetId = new Map<string, SceneTilesetIndexEntry>();
  const entryByAbsoluteIndex: Array<SceneTilesetIndexEntry | undefined> = [];

  for (const [tilesetIndex, tileset] of tilemap.tilesets.entries()) {
    const width = Math.max(0, Math.floor(tileset.width));
    const height = Math.max(0, Math.floor(tileset.height));
    const count = width * height;

    const entry = {
      tilesetId: tileset.id,
      tilesetIndex,
      width,
      height,
      offset,
      count,
    };

    entries.push(entry);

    if (!entryByTilesetId.has(entry.tilesetId)) {
      entryByTilesetId.set(entry.tilesetId, entry);
    }

    for (let i = 0; i < count; i++) {
      entryByAbsoluteIndex[offset + i] = entry;
    }

    offset += count;
  }

  return {
    entries,
    entryByTilesetId,
    entryByAbsoluteIndex,
  };
};

export const encodeSceneTileRef = (
  tilesetOffset: number,
  tileIndex = 0,
): number => {
  return tilesetOffset + tileIndex + 1;
};

export const decodeSceneTileRef = (
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

export const sceneStampLinePositions = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  stampWidth: number,
  stampHeight: number,
): Array<{ x: number; y: number }> => {
  const dx = endX - startX;
  const dy = endY - startY;
  const distance = Math.max(
    Math.abs(dx) / Math.max(1, stampWidth),
    Math.abs(dy) / Math.max(1, stampHeight),
  );
  const steps = Math.floor(distance);
  const positions: Array<{ x: number; y: number }> = [];
  for (let step = 1; step <= steps; step++) {
    positions.push({
      x: startX + Math.round((dx * step) / distance),
      y: startY + Math.round((dy * step) / distance),
    });
  }
  return positions;
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
      const ref = decodeSceneTileRef(value, tilesetLookup);
      if (ref?.tilesetId) {
        usedTilesetIds.add(ref.tilesetId);
      }
    }

    for (const value of layer.autotiles ?? []) {
      const ref = decodeSceneTileRef(value, tilesetLookup);
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
    const ref = decodeSceneTileRef(value, tilesetLookup);
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

export const isTilemapLayerCellTopmost = (
  tilemap: SceneTilemapData,
  layerIndex: number,
  cellIndex: number,
): boolean => {
  const layer = tilemap.layers[layerIndex];

  if (!layer?.visible || !layer.tiles[cellIndex]) {
    return false;
  }

  for (let index = layerIndex + 1; index < tilemap.layers.length; index++) {
    const aboveLayer = tilemap.layers[index];

    if (aboveLayer?.visible && aboveLayer.tiles[cellIndex]) {
      return false;
    }
  }

  return true;
};
