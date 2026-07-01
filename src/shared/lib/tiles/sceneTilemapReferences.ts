import type { SceneTilemapData } from "shared/lib/resources/types";

interface SceneTilesetIndexEntry {
  tilesetId: string;
  tilesetIndex: number;
  offset: number;
}

interface SceneTilesetLookup {
  entryByAbsoluteIndex: Array<SceneTilesetIndexEntry | undefined>;
}

export const buildSceneTilesetReferenceLookup = (
  tilemap: Pick<SceneTilemapData, "tilesets">,
): SceneTilesetLookup => {
  let offset = 0;
  const entryByAbsoluteIndex: Array<SceneTilesetIndexEntry | undefined> = [];

  for (const [tilesetIndex, tileset] of tilemap.tilesets.entries()) {
    const count =
      Math.max(0, Math.floor(tileset.width)) *
      Math.max(0, Math.floor(tileset.height));
    const entry = { tilesetId: tileset.id, tilesetIndex, offset };
    for (let index = 0; index < count; index++) {
      entryByAbsoluteIndex[offset + index] = entry;
    }
    offset += count;
  }

  return { entryByAbsoluteIndex };
};

export const decodeSceneTileReference = (
  value: number,
  lookup: SceneTilesetLookup,
) => {
  if (!value) return undefined;
  const absoluteIndex = value - 1;
  const entry = lookup.entryByAbsoluteIndex[absoluteIndex];
  if (!entry) return undefined;

  return {
    tilesetIndex: entry.tilesetIndex,
    tileIndex: absoluteIndex - entry.offset,
    tilesetId: entry.tilesetId,
  };
};
