import { assetFilename } from "shared/lib/helpers/assets";
import { getBackgroundInfo } from "lib/helpers/validation";
import {
  tileArrayToTileData,
  tilesAndLookupToTilemap,
  toTileLookup,
} from "shared/lib/tiles/tileData";
import {
  readFileToTilesDataArray,
  indexedImageToTilesDataArray,
} from "lib/tiles/readFileToTiles";
import {
  BackgroundData,
  Palette,
  TilesetData,
} from "shared/lib/entities/entitiesTypes";
import promiseLimit from "lib/helpers/promiseLimit";
import { FLAG_VRAM_BANK_1 } from "consts";
import { fileExists } from "lib/helpers/fs/fileExists";
import {
  readFileToPalettes,
  readFileToPalettesUsingTiles,
} from "lib/tiles/readFileToPalettes";
import type { ColorModeSetting } from "store/features/settings/settingsState";
import l10n from "shared/lib/lang/l10n";
import { monoOverrideForFilename } from "shared/lib/assets/backgrounds";

const TILE_FIRST_CHUNK_SIZE = 128;
const TILE_BANK_SIZE = 256;
const TILE_UI_OFFSET = 192;

type PrecompiledBackgroundData = BackgroundData & {
  commonTilesetId?: string;
  vramData: [number[], number[]];
  tilemap: number[];
  attr: number[];
  autoPalettes?: Palette[];
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

const mergeCommonTiles = async (
  tileData: Uint8Array[],
  commonTileset: TilesetData | undefined,
  projectPath: string
) => {
  if (!commonTileset) {
    return tileData;
  }
  const commonFilename = assetFilename(projectPath, "tilesets", commonTileset);
  const commonTileData = await readFileToTilesDataArray(commonFilename);
  return [...commonTileData, ...tileData];
};

enum ImageColorMode {
  MANUAL,
  AUTO_COLOR,
  AUTO_COLOR_WITH_DMG,
}

const buildAttr = (
  tileColors: number[],
  autoTileColors: number[],
  tileMapSize: number
) => {
  return padArrayEnd(tileColors || [], tileMapSize, 0).map(
    (manualAttr, index) => {
      return autoTileColors[index] !== undefined
        ? (manualAttr & 0xf8) + (autoTileColors[index] & 0x7)
        : manualAttr;
    }
  );
};

const compileImage = async (
  img: BackgroundData,
  commonTileset: TilesetData | undefined,
  is360: boolean,
  allocationStrat: number,
  colorMode: ColorModeSetting,
  projectPath: string,
  { warnings }: CompileImageOptions
): Promise<PrecompiledBackgroundData> => {
  let autoColorMode = ImageColorMode.MANUAL;
  const cgbOnly = colorMode === "color";
  const filename = assetFilename(projectPath, "backgrounds", img);
  const dmgFilename = monoOverrideForFilename(filename);

  if (img.autoColor && colorMode !== "mono") {
    const useDmgImg = img.monoOverrideId && (await fileExists(dmgFilename));
    autoColorMode = useDmgImg
      ? ImageColorMode.AUTO_COLOR_WITH_DMG
      : ImageColorMode.AUTO_COLOR;
  }

  const tilesFileName =
    autoColorMode === ImageColorMode.AUTO_COLOR_WITH_DMG
      ? dmgFilename
      : filename;

  const tileAllocationStrategy = cgbOnly
    ? imageTileAllocationColorOnly
    : imageTileAllocationDefault;

  let tileData: Uint8Array[] = [];
  let autoTileColors: number[] = [];
  let autoPalettes: Palette[] | undefined = undefined;
  if (autoColorMode === ImageColorMode.AUTO_COLOR) {
    // Extract both tiles and colors from color PNG
    const paletteData = await readFileToPalettes(filename);
    tileData = indexedImageToTilesDataArray(paletteData.indexedImage);
    autoTileColors = paletteData.map;
    autoPalettes = paletteData.palettes.map((colors, index) => ({
      id: `${img.id}_p${index}`,
      name: `${img.name} Palette ${index}`,
      colors,
    }));
  } else if (autoColorMode === ImageColorMode.AUTO_COLOR_WITH_DMG) {
    // Extract colors from color PNG and tiles from .mono PNG
    const paletteData = await readFileToPalettesUsingTiles(
      filename,
      tilesFileName
    );
    tileData = indexedImageToTilesDataArray(paletteData.indexedImage);
    autoTileColors = paletteData.map;
    autoPalettes = paletteData.palettes.map((colors, index) => ({
      id: `${img.id}_p${index}`,
      name: `${img.name} Palette ${index}`,
      colors,
    }));
  } else {
    // Extract tiles from PNG and use manual color data
    tileData = await readFileToTilesDataArray(tilesFileName);
  }

  // Warn if auto palettes extracted too many unique palettes
  if (autoPalettes && autoPalettes.length > 8) {
    warnings(
      `${img.filename}: ${l10n("WARNING_BACKGROUND_TOO_MANY_PALETTES", {
        paletteLength: autoPalettes.length,
        maxPaletteLength: 8,
      })}`
    );
  }

  if (is360) {
    const tilemap = Array.from(Array(360)).map((_, i) => i);
    const tiles = tileArrayToTileData(tileData);
    const attr = buildAttr(img.tileColors, autoTileColors, tilemap.length);
    return {
      ...img,
      vramData: [[...tiles], []],
      tilemap,
      attr,
      autoPalettes,
    };
  }

  const tileDataWithCommon = await mergeCommonTiles(
    tileData,
    commonTileset,
    projectPath
  );
  const tilesetLookup = toTileLookup(tileDataWithCommon) ?? {};
  const uniqueTiles = Object.values(tilesetLookup);
  const tilemap = tilesAndLookupToTilemap(tileData, tilesetLookup);

  const backgroundInfo = await getBackgroundInfo(
    img,
    undefined,
    false,
	allocationStrat,
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
  const attr = buildAttr(img.tileColors, autoTileColors, tilemap.length).map(
    (attr, index) => {
      const tile = tilemap[index];
      const { inVRAM2, tileIndex } = tileAllocationStrategy(
        tile,
        uniqueTiles.length,
        img
      );
      // Reallocate tilemap based on strategy
	  // first bit of allocationStrat specify if reverse the tile order past 128 toward sprite tiles (sprite tile priority) (default true)
	  const reverseTile = ((allocationStrat) & 1)? false: true;
	   // second bit of allocationStrat specify if we reserve the default ui tiles (default 192)
	  const reservedOffset = ((allocationStrat >> 1) & 1)? TILE_BANK_SIZE: TILE_UI_OFFSET;
	  if (reverseTile){
		if (tileIndex < TILE_FIRST_CHUNK_SIZE) {
			tilemap[index] = tileIndex;
		} else {
			// tile index > 128 is allocated with an unused tile offset
			// to allow as much tiles as possible for sprite data
			const bankSize = vramData[inVRAM2 ? 1 : 0].length / 16;
			const offset = Math.max(reservedOffset - bankSize, 0);
			tilemap[index] = tileIndex + offset;
		}
	  } else {
		tilemap[index] = tileIndex;
	  }
      if (inVRAM2) {
        return attr | FLAG_VRAM_BANK_1;
      }
      return attr;
    }
  );

  return {
    ...img,
    symbol: commonTileset
      ? `${img.symbol}_${commonTileset.symbol}`
      : img.symbol,
    commonTilesetId: commonTileset?.id,
    vramData,
    tilemap,
    attr,
    autoPalettes,
  };
};

const compileImages = async (
  imgs: BackgroundData[],
  commonTilesetsLookup: Record<string, TilesetData[]>,
  generate360Ids: string[],
  allocationStratLookup: Record<string, number>,
  colorMode: ColorModeSetting,
  projectPath: string,
  { warnings }: CompileImageOptions
): Promise<PrecompiledBackgroundData[]> => {
  return promiseLimit(
    10,
    imgs
      .map((img) => {
        const commonTilesets = commonTilesetsLookup[img.id] ?? [];
        return [
          () =>
            compileImage(
              img,
              undefined,
              generate360Ids.includes(img.id),
			  allocationStratLookup[img.id] ?? 0,
              colorMode,
              projectPath,
              { warnings }
            ),
          ...commonTilesets.map((commonTileset) => {
            return () =>
              compileImage(
                img,
                commonTileset,
                generate360Ids.includes(img.id),
				allocationStratLookup[img.id] ?? 0,
                colorMode,
                projectPath,
                { warnings }
              );
          }),
        ];
      })
      .flat()
  );
};

export default compileImages;
