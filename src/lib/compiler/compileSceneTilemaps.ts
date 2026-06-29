import {
  TILE_FIRST_CHUNK_SIZE,
  TILE_BANK_SIZE,
  FLAG_VRAM_BANK_1,
  MAX_BACKGROUND_TILES_CGB,
  MAX_BACKGROUND_TILES,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
} from "consts";
import {
  imageTileAllocationColorOnly,
  imageTileAllocationDefault,
} from "lib/compiler/tileAllocation";
import { readFileToTilesDataArray } from "lib/tiles/readFileToTiles";
import { padArrayEnd } from "shared/lib/helpers/array";
import { assetFilename } from "shared/lib/helpers/assets";
import l10n from "shared/lib/lang/l10n";
import {
  Tileset,
  ColorModeSetting,
  SceneTilemapData,
} from "shared/lib/resources/types";
import { autoFlipTileData } from "shared/lib/tiles/autoFlip";
import {
  tileArrayToTileData,
  hashTileData,
  toTileLookup,
  tilesAndLookupToTilemap,
} from "shared/lib/tiles/tileData";
import {
  flattenTilemapLayers,
  buildSceneTilesetIndex,
  decodeSceneTileRef,
} from "shared/lib/tiles/sceneTilemapData";

type PrecompiledSceneTilemapData = {
  id: string;
  name: string;
  symbol: string;
  width: number;
  height: number;
  commonTilesetId?: string;
  vramData: [number[], number[]];
  tilemap: number[];
  attr: number[];
  is360: boolean;
  colorMode: ColorModeSetting;
  tilesetLength: number;
};

type CompileImageOptions = {
  warnings: (msg: string) => void;
};

type SceneTilemapCompileInput = {
  id: string;
  name: string;
  symbol: string;
  width: number;
  height: number;
  type: string;
  tilemap: SceneTilemapData;
};

const BLANK_TILE = new Uint8Array(16);

export const compileTilemapLayers = async (
  scene: SceneTilemapCompileInput,
  tilesetsLookup: Record<string, Tileset>,
  commonTileset: Tileset | undefined,
  colorMode: ColorModeSetting,
  projectPath: string,
  autoTileFlipEnabled: boolean,
  { warnings }: CompileImageOptions,
): Promise<PrecompiledSceneTilemapData> => {
  const sceneTilemap = scene.tilemap;

  const isInvalidSize =
    scene.width < SCREEN_WIDTH ||
    scene.height < SCREEN_HEIGHT ||
    scene.width > 255 ||
    scene.height > 255;

  if (isInvalidSize) {
    warnings(
      `Tilemap used by scene "${scene.name}" is an invalid size ${scene.width}x${scene.height}`,
    );
    return {
      id: scene.id,
      name: scene.name,
      symbol: `${scene.symbol}_tilemap`,
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      vramData: [[...BLANK_TILE], []],
      tilemap: new Array(SCREEN_WIDTH * SCREEN_HEIGHT).fill(0),
      attr: new Array(SCREEN_WIDTH * SCREEN_HEIGHT).fill(0),
      is360: false,
      colorMode,
      commonTilesetId: commonTileset?.id,
      tilesetLength: 1,
    };
  }

  const sourceTiles = new Map<string, Uint8Array[]>();

  for (const tilesetId of sceneTilemap.tilesetIds) {
    const tileset = tilesetsLookup[tilesetId];
    if (tileset) {
      sourceTiles.set(
        tilesetId,
        await readFileToTilesDataArray(
          assetFilename(projectPath, "tilesets", tileset),
        ),
      );
    }
  }

  const commonTileData = commonTileset
    ? await readFileToTilesDataArray(
        assetFilename(projectPath, "tilesets", commonTileset),
      )
    : [];

  const refs = flattenTilemapLayers(sceneTilemap, scene.width, scene.height);
  const sceneAttrs = sceneTilemap.tileColors ?? [];

  const tilesetIndex = buildSceneTilesetIndex(sceneTilemap, tilesetsLookup);

  let cellTiles = refs.map((value) => {
    const ref = decodeSceneTileRef(value, tilesetIndex);
    if (!ref) {
      return BLANK_TILE;
    }
    return sourceTiles.get(ref.tilesetId)?.[ref.tileIndex] ?? BLANK_TILE;
  });

  let attrs = sceneAttrs;
  const cgbOnly = colorMode === "color";

  if (cgbOnly && autoTileFlipEnabled) {
    const flipped = autoFlipTileData({
      tileData: cellTiles,
      tileColors: attrs,
      commonTileData,
    });
    cellTiles = flipped.tileData;
    attrs = flipped.tileAttrs;
  }

  if (scene.type === "LOGO") {
    const logoTileCount = 20 * 18;
    const logoTiles = Array.from(
      { length: logoTileCount },
      (_, index) => cellTiles[index] ?? BLANK_TILE,
    );
    const tilemap = Array.from({ length: logoTileCount }, (_, index) => index);
    const attr = padArrayEnd(attrs, logoTileCount, 0).slice(0, logoTileCount);
    return {
      id: scene.id,
      name: scene.name,
      symbol: `${scene.symbol}_tilemap`,
      width: 20,
      height: 18,
      vramData: [[...tileArrayToTileData(logoTiles)], []],
      tilemap,
      attr,
      is360: true,
      colorMode,
      tilesetLength: logoTileCount,
    };
  }

  const commonHashes = new Set(commonTileData.map(hashTileData));
  const uniqueTiles = Array.from(
    new Map(cellTiles.map((tile) => [hashTileData(tile), tile])).entries(),
  )
    .filter(([hash]) => !commonHashes.has(hash))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, tile]) => tile);
  const tilesetData = [...commonTileData, ...uniqueTiles];
  const tilesetLookup = toTileLookup(tilesetData);
  const tilemap = tilesAndLookupToTilemap(cellTiles, tilesetLookup);
  const allocation = cgbOnly
    ? imageTileAllocationColorOnly
    : imageTileAllocationDefault;
  const vramData: [number[], number[]] = [[], []];
  Object.values(tilesetLookup).forEach((tile, index, tiles) => {
    const { inVRAM2 } = allocation(index, tiles.length);
    vramData[inVRAM2 ? 1 : 0].push(...tile);
  });
  const attr = padArrayEnd(attrs, tilemap.length, 0).map((value, index) => {
    const { inVRAM2, tileIndex } = allocation(
      tilemap[index] ?? 0,
      Object.keys(tilesetLookup).length,
    );
    if (tileIndex < TILE_FIRST_CHUNK_SIZE) {
      tilemap[index] = tileIndex;
    } else {
      const bankSize = vramData[inVRAM2 ? 1 : 0].length / 16;
      tilemap[index] = tileIndex + Math.max(TILE_BANK_SIZE - bankSize, 0);
    }
    return inVRAM2 ? value | FLAG_VRAM_BANK_1 : value;
  });
  const tilesetLength = Object.keys(tilesetLookup).length;
  const maxTiles = cgbOnly ? MAX_BACKGROUND_TILES_CGB : MAX_BACKGROUND_TILES;
  if (tilesetLength > maxTiles) {
    warnings(
      l10n("WARNING_BACKGROUND_TOO_MANY_TILES", {
        tilesetLength,
        maxTilesetLength: maxTiles,
      }),
    );
  }

  return {
    id: scene.id,
    name: scene.name,
    symbol: `${scene.symbol}_tilemap`,
    width: scene.width,
    height: scene.height,
    vramData,
    tilemap,
    attr,
    is360: false,
    colorMode,
    commonTilesetId: commonTileset?.id,
    tilesetLength,
  };
};
