import { assetFilename } from "shared/lib/helpers/assets";
import {
  tileArrayToTileData,
  tileDataIndexFn,
  tilesAndLookupToTilemap,
  toTileLookup,
} from "shared/lib/tiles/tileData";
import {
  readFileToTilesDataArray,
  readFileToIndexedImage,
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
import { ColorCorrectionSetting } from "shared/lib/resources/types";
import { ReferencedBackground } from "./precompile/determineUsedAssets";
import { HexPalette } from "shared/lib/tiles/autoColor";
import { divisibleBy8 } from "shared/lib/helpers/8bit";
import { MAX_BACKGROUND_TILES, MAX_BACKGROUND_TILES_CGB } from "consts";
import { IndexedImage } from "shared/lib/tiles/indexedImage";
import { autoFlipTiles } from "shared/lib/tiles/autoFlip";

const TILE_FIRST_CHUNK_SIZE = 128;
const TILE_BANK_SIZE = 192;

const MAX_IMAGE_WIDTH = 2040;
const MAX_IMAGE_HEIGHT = 2040;
const MAX_PIXELS = 16380 * 64;

type PrecompiledBackgroundData = BackgroundData & {
  commonTilesetId?: string;
  vramData: [number[], number[]];
  tilemap: number[];
  attr: number[];
  autoPalettes?: Palette[];
  is360: boolean;
  colorMode: ColorModeSetting;
  tilesetLength: number;
};

type CompileImageOptions = {
  warnings: (msg: string) => void;
};

type ImageTileAllocationStrategy = (
  tileIndex: number,
  numTiles: number,
  image: BackgroundData,
) => { tileIndex: number; inVRAM2: boolean };

/**
 * Allocates an image tile for to default DMG location.
 *
 * @param {number} tileIndex - The index of the tile to allocate.
 * @returns {{ tileIndex: number, inVRAM2: boolean }} Updated tile index and flag which is set if tile has been reallocated to VRAM bank2.
 */
export const imageTileAllocationDefault: ImageTileAllocationStrategy = (
  tileIndex,
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
 * @returns {{ tileIndex: number, inVRAM2: boolean }} Updated tile index and flag which is set if tile has been reallocated to VRAM bank2.
 */
export const imageTileAllocationColorOnly: ImageTileAllocationStrategy = (
  tileIndex: number,
): { tileIndex: number; inVRAM2: boolean } => {
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
  projectPath: string,
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
  tileMapSize: number,
) => {
  return padArrayEnd(tileColors || [], tileMapSize, 0).map(
    (manualAttr, index) => {
      return autoTileColors[index] !== undefined
        ? (manualAttr & 0xf8) + (autoTileColors[index] & 0x7)
        : manualAttr;
    },
  );
};

export const compileImage = async (
  img: BackgroundData,
  commonTileset: TilesetData | undefined,
  is360: boolean,
  uiPalette: HexPalette | undefined,
  colorMode: ColorModeSetting,
  colorCorrection: ColorCorrectionSetting,
  autoTileFlipEnabled: boolean,
  projectPath: string,
  { warnings }: CompileImageOptions,
): Promise<PrecompiledBackgroundData> => {
  let autoColorMode = ImageColorMode.MANUAL;
  const cgbOnly = colorMode === "color";
  const filename = assetFilename(projectPath, "backgrounds", img);
  const dmgFilename = monoOverrideForFilename(filename);
  const useDmgImg = img.monoOverrideId && (await fileExists(dmgFilename));

  if (img.autoColor && colorMode !== "mono") {
    autoColorMode = useDmgImg
      ? ImageColorMode.AUTO_COLOR_WITH_DMG
      : ImageColorMode.AUTO_COLOR;
  }

  const tilesFileName = useDmgImg ? dmgFilename : filename;

  const tileAllocationStrategy = cgbOnly
    ? imageTileAllocationColorOnly
    : imageTileAllocationDefault;

  let autoTileColors: number[] = [];
  let autoPalettes: Palette[] | undefined = undefined;
  let indexedImage: IndexedImage | undefined = undefined;

  if (autoColorMode === ImageColorMode.AUTO_COLOR) {
    // Extract both tiles and colors from color PNG
    const paletteData = await readFileToPalettes(
      filename,
      colorCorrection,
      uiPalette,
    );
    indexedImage = paletteData.indexedImage;
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
      tilesFileName,
      colorCorrection,
      uiPalette,
    );
    indexedImage = paletteData.indexedImage;
    autoTileColors = paletteData.map;
    autoPalettes = paletteData.palettes.map((colors, index) => ({
      id: `${img.id}_p${index}`,
      name: `${img.name} Palette ${index}`,
      colors,
    }));
  } else {
    // Extract tiles from PNG and use manual color data
    indexedImage = await readFileToIndexedImage(tilesFileName, tileDataIndexFn);
  }

  // Warn if auto palettes extracted too many unique palettes
  if (autoPalettes && autoPalettes.length > 8) {
    warnings(
      `${img.filename}: ${l10n("WARNING_BACKGROUND_TOO_MANY_PALETTES", {
        paletteLength: autoPalettes.length,
        maxPaletteLength: 8,
      })}`,
    );
  }

  const imgTileFlipEnabled =
    cgbOnly &&
    (img.autoTileFlipOverride === undefined
      ? autoTileFlipEnabled
      : img.autoTileFlipOverride);

  const { tileData, tileAttrs } = imgTileFlipEnabled
    ? await autoFlipTiles({
        indexedImage,
        tileColors: img.tileColors,
        commonTileset,
        projectPath,
      })
    : {
        tileData: await readFileToTilesDataArray(tilesFileName),
        tileAttrs: img.tileColors,
      };

  if (is360) {
    const tilemap = Array.from(Array(360)).map((_, i) => i);
    const tiles = tileArrayToTileData(tileData);
    const attr = buildAttr(tileAttrs, autoTileColors, tilemap.length);
    return {
      ...img,
      vramData: [[...tiles], []],
      tilemap,
      attr,
      autoPalettes,
      is360,
      colorMode,
      tilesetLength: 360,
    };
  }

  const tileDataWithCommon = await mergeCommonTiles(
    tileData,
    commonTileset,
    projectPath,
  );
  const tilesetLookup = toTileLookup(tileDataWithCommon) ?? {};
  const uniqueTiles = Object.values(tilesetLookup);
  const tilemap = tilesAndLookupToTilemap(tileData, tilesetLookup);
  const tilesetLength = Object.keys(tilesetLookup).length;

  if (img.imageWidth < 160 || img.imageHeight < 144) {
    warnings(l10n("WARNING_BACKGROUND_TOO_SMALL"));
  }
  if (img.imageWidth > MAX_IMAGE_WIDTH) {
    warnings(
      l10n("WARNING_BACKGROUND_TOO_WIDE", {
        width: img.imageWidth,
        maxWidth: MAX_IMAGE_WIDTH,
      }),
    );
  }
  if (img.imageHeight > MAX_IMAGE_HEIGHT) {
    warnings(
      l10n("WARNING_BACKGROUND_TOO_TALL", {
        height: img.imageHeight,
        maxHeight: MAX_IMAGE_HEIGHT,
      }),
    );
  }
  if (img.imageWidth * img.imageHeight > MAX_PIXELS) {
    warnings(
      l10n("WARNING_BACKGROUND_TOO_MANY_PIXELS", {
        width: img.imageWidth,
        height: img.imageHeight,
        numPixels: img.imageWidth * img.imageHeight,
        maxPixels: MAX_PIXELS,
      }),
    );
  }
  if (!divisibleBy8(img.imageWidth) || !divisibleBy8(img.imageHeight)) {
    warnings(l10n("WARNING_BACKGROUND_NOT_MULTIPLE_OF_8"));
  }
  if (tilesetLength > MAX_BACKGROUND_TILES && !is360 && !cgbOnly) {
    warnings(
      l10n("WARNING_BACKGROUND_TOO_MANY_TILES", {
        tilesetLength,
        maxTilesetLength: MAX_BACKGROUND_TILES,
      }),
    );
  }

  if (tilesetLength > MAX_BACKGROUND_TILES_CGB && !is360 && cgbOnly) {
    warnings(
      l10n("WARNING_BACKGROUND_TOO_MANY_TILES", {
        tilesetLength,
        maxTilesetLength: MAX_BACKGROUND_TILES_CGB,
      }),
    );
  }

  if (is360 && (img.imageWidth !== 160 || img.imageHeight !== 144)) {
    warnings(
      l10n("WARNING_LOGO_WRONG_SIZE", {
        width: img.imageWidth,
        height: img.imageHeight,
      }),
    );
  }

  const vramData: [number[], number[]] = [[], []];

  // Split tiles into VRAM banks based on allocation strategy
  uniqueTiles.forEach((tile, i, tiles) => {
    const { inVRAM2 } = tileAllocationStrategy(i, tiles.length, img);
    vramData[inVRAM2 ? 1 : 0].push(...tile);
  });

  // Determine tilemap attrs
  const attr = buildAttr(tileAttrs, autoTileColors, tilemap.length).map(
    (attr, index) => {
      const tile = tilemap[index];
      const { inVRAM2, tileIndex } = tileAllocationStrategy(
        tile,
        uniqueTiles.length,
        img,
      );
      // Reallocate tilemap based on strategy
      if (tileIndex < TILE_FIRST_CHUNK_SIZE) {
        tilemap[index] = tileIndex;
      } else {
        // tile index > 128 is allocated with an unused tile offset
        // to allow as much tiles as possible for sprite data
        const bankSize = vramData[inVRAM2 ? 1 : 0].length / 16;
        const offset = Math.max(TILE_BANK_SIZE - bankSize, 0);
        tilemap[index] = tileIndex + offset;
      }
      if (inVRAM2) {
        return attr | FLAG_VRAM_BANK_1;
      }
      return attr;
    },
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
    is360,
    colorMode,
    tilesetLength,
  };
};

const compileImages = async (
  imgs: ReferencedBackground[],
  commonTilesetsLookup: Record<string, TilesetData[]>,
  colorCorrection: ColorCorrectionSetting,
  autoTileFlipEnabled: boolean,
  projectPath: string,
  { warnings }: CompileImageOptions,
): Promise<PrecompiledBackgroundData[]> => {
  return promiseLimit(
    10,
    imgs
      .map((img) => {
        const commonTilesets = commonTilesetsLookup[img.id] ?? [];
        // If this background has never been used with a common tileset
        // or has been referenced without a common tileset at any point
        // it's tiles should always be generated
        const forceGenerateTileset =
          commonTilesets.length === 0 || img.forceTilesetGeneration;
        return [
          // Generate background with no common tilesets applied
          ...(forceGenerateTileset
            ? [
                () =>
                  compileImage(
                    img,
                    undefined,
                    img.is360,
                    img.uiPalette,
                    img.colorMode,
                    colorCorrection,
                    autoTileFlipEnabled,
                    projectPath,
                    { warnings },
                  ),
              ]
            : []),
          // Generate background with each used common tileset
          ...commonTilesets.map((commonTileset) => {
            return () =>
              compileImage(
                img,
                commonTileset,
                img.is360,
                img.uiPalette,
                img.colorMode,
                colorCorrection,
                autoTileFlipEnabled,
                projectPath,
                { warnings },
              );
          }),
        ];
      })
      .flat(),
  );
};

export default compileImages;
