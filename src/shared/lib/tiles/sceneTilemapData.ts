import {
  AutotileDefinition,
  AutotileType,
  SceneTilemapLayer,
  SceneTilemapData,
} from "shared/lib/resources/types";
import {
  clearGridSelection,
  moveGridSelection,
  type GridOffset,
  type GridSelection,
} from "./grid";
import { MAX_SCENE_TILE_COUNT } from "consts";

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

export const autotileGroupSize = (type: AutotileType): number =>
  type === "9slice" ? 3 : 4;

export const isAutotileDefinitionWithinBounds = (
  definition: AutotileDefinition,
  width: number,
  height: number,
): boolean => {
  if (width <= 0 || height <= 0) {
    return false;
  }
  const x = definition.startTile % width;
  const y = Math.floor(definition.startTile / width);
  const groupSize = autotileGroupSize(definition.type);
  return x + groupSize <= width && y + groupSize <= height;
};

export const isTileWithinAutotileDefinition = (
  tileIndex: number,
  tilesetWidth: number,
  definition: AutotileDefinition,
): boolean => {
  if (tilesetWidth <= 0) {
    return false;
  }
  const clickedX = tileIndex % tilesetWidth;
  const clickedY = Math.floor(tileIndex / tilesetWidth);
  const groupX = definition.startTile % tilesetWidth;
  const groupY = Math.floor(definition.startTile / tilesetWidth);
  const groupSize = autotileGroupSize(definition.type);
  return (
    clickedX >= groupX &&
    clickedX < groupX + groupSize &&
    clickedY >= groupY &&
    clickedY < groupY + groupSize
  );
};

// Inverse lookup: connectivity mask to tile offset within the variant block.
const AUTOTILE_MASK_TO_VARIANT: readonly number[] = [
  12, 15, 8, 9, 13, 4, 1, 10, 0, 11, 14, 7, 3, 2, 5, 6,
];

type ResolvedAutotileSource = {
  definitionId: number;
  type: AutotileType;
  tilesetOffset: number;
  tileIndex: number;
  tilesetWidth: number;
};

const resolveAutotileVariant = (
  source: ResolvedAutotileSource,
  north: boolean,
  east: boolean,
  south: boolean,
  west: boolean,
  connected: (offsetX: number, offsetY: number) => boolean,
): number => {
  if (source.type === "9slice") {
    const variantX = !west ? 0 : !east ? 2 : 1;
    const variantY = !north ? 0 : !south ? 2 : 1;
    return encodeSceneTileRef(
      source.tilesetOffset,
      source.tileIndex + variantX + variantY * source.tilesetWidth,
    );
  }

  let mask = 0;
  if (north && west && connected(-1, -1)) mask |= 1;
  if (north && east && connected(1, -1)) mask |= 2;
  if (south && east && connected(1, 1)) mask |= 4;
  if (south && west && connected(-1, 1)) mask |= 8;
  const variant = AUTOTILE_MASK_TO_VARIANT[mask] ?? -1;
  return variant >= 0
    ? encodeSceneTileRef(
        source.tilesetOffset,
        source.tileIndex +
          (variant % 4) +
          Math.floor(variant / 4) * source.tilesetWidth,
      )
    : 0;
};

export const resolveSceneAutotiles = (
  autotiles: readonly number[],
  width: number,
  height: number,
  tilemap: Pick<SceneTilemapData, "tilesets" | "autotiles">,
): number[] => {
  const size = width * height;
  const tilesetLookup = buildSceneTilesetLookup(tilemap);

  const autotileSources = new Array<ResolvedAutotileSource | undefined>(size);

  for (let index = 0; index < size; index++) {
    const definitionId = autotiles[index] ?? 0;
    const definition = tilemap.autotiles?.[definitionId - 1];
    const ref = definition
      ? decodeSceneTileRef(definition.startTile, tilesetLookup)
      : undefined;

    if (!ref || !definition) {
      continue;
    }

    const tilesetWidth = tilesetLookup.entries[ref.tilesetIndex]?.width;

    if (!tilesetWidth) {
      continue;
    }

    autotileSources[index] = {
      definitionId,
      type: definition.type,
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
      autotileSources[neighbourY * width + neighbourX]?.definitionId ===
      source.definitionId
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

    resolved[index] = resolveAutotileVariant(
      source,
      north,
      east,
      south,
      west,
      (offsetX, offsetY) => connected(source, x, y, offsetX, offsetY),
    );
  }

  return resolved;
};

export const resolveSceneAutotilesForCells = (
  autotiles: readonly number[],
  width: number,
  height: number,
  tilemap: Pick<SceneTilemapData, "tilesets" | "autotiles">,
  cellIndexes: Iterable<number>,
): Map<number, number> => {
  const tilesetLookup = buildSceneTilesetLookup(tilemap);
  const sourceCache = new Map<number, ResolvedAutotileSource | undefined>();
  const sourceAt = (index: number) => {
    if (sourceCache.has(index)) {
      return sourceCache.get(index);
    }
    const definitionId = autotiles[index] ?? 0;
    const definition = tilemap.autotiles?.[definitionId - 1];
    const ref = definition
      ? decodeSceneTileRef(definition.startTile, tilesetLookup)
      : undefined;
    const tilesetWidth = ref
      ? tilesetLookup.entries[ref.tilesetIndex]?.width
      : undefined;
    const source =
      ref && definition && tilesetWidth
        ? {
            definitionId,
            type: definition.type,
            tilesetOffset: ref.tilesetOffset,
            tileIndex: ref.tileIndex,
            tilesetWidth,
          }
        : undefined;
    sourceCache.set(index, source);
    return source;
  };
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
      sourceAt(neighbourY * width + neighbourX)?.definitionId ===
      source.definitionId
    );
  };
  const resolved = new Map<number, number>();

  for (const index of cellIndexes) {
    const source = sourceAt(index);
    if (!source) {
      resolved.set(index, 0);
      continue;
    }
    const x = index % width;
    const y = Math.floor(index / width);
    const north = connected(source, x, y, 0, -1);
    const east = connected(source, x, y, 1, 0);
    const south = connected(source, x, y, 0, 1);
    const west = connected(source, x, y, -1, 0);
    resolved.set(
      index,
      resolveAutotileVariant(
        source,
        north,
        east,
        south,
        west,
        (offsetX, offsetY) => connected(source, x, y, offsetX, offsetY),
      ),
    );
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

export { flattenTilemapLayers } from "shared/lib/tiles/sceneTilemapReferences";

export const isSceneAutotileDefinitionValid = (
  definition: AutotileDefinition,
  tilesetLookup: SceneTilesetLookup,
): boolean => {
  const ref = decodeSceneTileRef(definition.startTile, tilesetLookup);
  const entry = ref ? tilesetLookup.entries[ref.tilesetIndex] : undefined;
  if (!ref || !entry || entry.width <= 0) return false;
  return isAutotileDefinitionWithinBounds(
    { ...definition, startTile: ref.tileIndex },
    entry.width,
    entry.height,
  );
};

export const remapSceneAutotileDefinitions = (
  definitions: readonly AutotileDefinition[] | undefined,
  layers: readonly SceneTilemapLayer[],
  remapStartTile: (
    value: number,
    definition: AutotileDefinition,
    definitionId: number,
  ) => number,
): {
  autotiles: AutotileDefinition[];
  layers: SceneTilemapLayer[];
} => {
  const idMap = new Map<number, number>();
  const autotiles: AutotileDefinition[] = [];

  for (const [index, definition] of (definitions ?? []).entries()) {
    const startTile = remapStartTile(
      definition.startTile,
      definition,
      index + 1,
    );
    if (!startTile) continue;
    idMap.set(index + 1, autotiles.length + 1);
    autotiles.push({ ...definition, startTile });
  }

  const nextLayers = layers.map((layer) => ({
    ...layer,
    ...(layer.autotiles
      ? {
          autotiles: layer.autotiles.map((id) =>
            id ? (idMap.get(id) ?? 0) : 0,
          ),
        }
      : {}),
  }));

  return { autotiles, layers: nextLayers };
};

export const pruneTilemapLayersTilesets = (
  tilemap: SceneTilemapData,
): SceneTilemapData => {
  const usedAutotileIds = new Set<number>();
  for (const layer of tilemap.layers) {
    for (const definitionId of layer.autotiles ?? []) {
      if (definitionId > 0) usedAutotileIds.add(definitionId);
    }
  }

  const usedTilesetIds = new Set<string>();
  const tilesetLookup = buildSceneTilesetLookup(tilemap);
  const { entries, entryByAbsoluteIndex } = tilesetLookup;
  const remappedAutotiles = remapSceneAutotileDefinitions(
    tilemap.autotiles,
    tilemap.layers,
    (startTile, definition, definitionId) => {
      if (!usedAutotileIds.has(definitionId)) return 0;
      return isSceneAutotileDefinitionValid(definition, tilesetLookup)
        ? startTile
        : 0;
    },
  );
  const autotileDefinitions = remappedAutotiles.autotiles;
  const layersWithPrunedAutotiles = remappedAutotiles.layers;
  const autotilesChanged =
    autotileDefinitions.length !== (tilemap.autotiles?.length ?? 0) ||
    layersWithPrunedAutotiles.some((layer, index) =>
      layer.autotiles?.some(
        (id, cellIndex) => id !== tilemap.layers[index]?.autotiles?.[cellIndex],
      ),
    );

  const usedTilesetIndexes = new Array<boolean>(entries.length).fill(false);
  let invalidRefSeen = false;

  const scanRefs = (values: readonly number[] | undefined) => {
    if (!values) {
      return;
    }

    for (let i = 0; i < values.length; i++) {
      const value = values[i];

      if (!value) {
        if (value !== 0) {
          invalidRefSeen = true;
        }
        continue;
      }

      const entry = entryByAbsoluteIndex[value - 1];

      if (!entry) {
        invalidRefSeen = true;
        continue;
      }

      usedTilesetIds.add(entry.tilesetId);
      usedTilesetIndexes[entry.tilesetIndex] = true;
    }
  };

  // Find tilesets that are still being referenced.
  for (const layer of layersWithPrunedAutotiles) {
    scanRefs(layer.tiles);
  }
  scanRefs(autotileDefinitions.map((definition) => definition.startTile));

  // Keep only tilesets that are still referenced
  const seenTilesetIds = new Set<string>();
  const tilesets: SceneTilemapData["tilesets"] = [];
  const newOffsetByTilesetId = new Map<string, number>();

  let nextOffset = 0;
  let tilesetsChanged = false;

  for (let index = 0; index < tilemap.tilesets.length; index++) {
    const tileset = tilemap.tilesets[index];
    const entry = entries[index];

    const keep =
      !!entry &&
      usedTilesetIds.has(tileset.id) &&
      !seenTilesetIds.has(tileset.id);

    if (!keep) {
      tilesetsChanged = true;
      continue;
    }

    seenTilesetIds.add(tileset.id);
    newOffsetByTilesetId.set(tileset.id, nextOffset);
    tilesets.push(tileset);

    if (tilesets.length - 1 !== index) {
      tilesetsChanged = true;
    }

    nextOffset += entry.count;
  }

  if (tilesets.length !== tilemap.tilesets.length) {
    tilesetsChanged = true;
  }

  // Map every original tileset index to the new offset for its tileset id
  const newOffsetByTilesetIndex = new Array<number>(entries.length).fill(-1);

  for (const entry of entries) {
    const newOffset = newOffsetByTilesetId.get(entry.tilesetId);
    if (newOffset !== undefined) {
      newOffsetByTilesetIndex[entry.tilesetIndex] = newOffset;
    }
  }

  let remapRequired = invalidRefSeen;

  if (!remapRequired) {
    for (let index = 0; index < entries.length; index++) {
      const entry = entries[index];

      if (
        usedTilesetIndexes[index] &&
        newOffsetByTilesetIndex[index] !== entry.offset
      ) {
        remapRequired = true;
        break;
      }
    }
  }

  if (!tilesetsChanged && !remapRequired && !autotilesChanged) {
    return tilemap;
  }

  if (!remapRequired) {
    return {
      ...tilemap,
      tilesets,
      ...(tilemap.autotiles ? { autotiles: autotileDefinitions } : {}),
      layers: layersWithPrunedAutotiles,
    };
  }

  const remapRefs = (values: readonly number[]): number[] => {
    const result = new Array<number>(values.length);

    for (let i = 0; i < values.length; i++) {
      const value = values[i];

      if (!value) {
        result[i] = 0;
        continue;
      }

      const absoluteIndex = value - 1;
      const entry = entryByAbsoluteIndex[absoluteIndex];

      if (!entry) {
        result[i] = 0;
        continue;
      }

      const newOffset = newOffsetByTilesetIndex[entry.tilesetIndex];

      result[i] =
        newOffset >= 0 ? newOffset + (absoluteIndex - entry.offset) + 1 : 0;
    }

    return result;
  };

  return {
    ...tilemap,
    tilesets,
    ...(tilemap.autotiles
      ? {
          autotiles: autotileDefinitions.map((definition) => ({
            ...definition,
            startTile: remapRefs([definition.startTile])[0] ?? 0,
          })),
        }
      : {}),
    layers: layersWithPrunedAutotiles.map((layer) => ({
      ...layer,
      tiles: remapRefs(layer.tiles),
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

export const normalizeTilemapLayersSize = ({
  width: requestedWidth,
  height: requestedHeight,
  resizeAxis,
}: {
  width: number;
  height: number;
  resizeAxis: "width" | "height";
}) => {
  let width = Math.min(255, Math.max(20, Math.floor(requestedWidth)));
  let height = Math.min(255, Math.max(18, Math.floor(requestedHeight)));
  if (width * height > MAX_SCENE_TILE_COUNT) {
    if (resizeAxis === "width") {
      width = Math.max(20, Math.floor(MAX_SCENE_TILE_COUNT / height));
    } else {
      height = Math.max(18, Math.floor(MAX_SCENE_TILE_COUNT / width));
    }
  }
  return { width, height };
};
