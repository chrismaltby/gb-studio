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
  indexedImageToTilesDataArray,
} from "lib/tiles/readFileToTiles";
import promiseLimit from "lib/helpers/promiseLimit";
import {
  FLAG_VRAM_BANK_1,
  TILE_BANK_SIZE,
  TILE_FIRST_CHUNK_SIZE,
  MAX_BACKGROUND_TILES,
  MAX_BACKGROUND_TILES_CGB,
  MAX_SCENE_TILE_COUNT,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  TILE_SIZE,
} from "consts";
import { fileExists } from "lib/helpers/fs/fileExists";
import {
  readFileToPalettes,
  readFileToPalettesUsingTiles,
} from "lib/tiles/readFileToPalettes";
import type { ColorModeSetting } from "store/features/settings/settingsState";
import l10n from "shared/lib/lang/l10n";
import { monoOverrideForFilename } from "shared/lib/assets/backgrounds";
import {
  Background,
  ColorCorrectionSetting,
  Palette,
  Tileset,
} from "shared/lib/resources/types";
import { ReferencedBackground } from "./precompile/determineUsedAssets";
import { HexPalette } from "shared/lib/tiles/autoColor";
import { divisibleBy8 } from "shared/lib/helpers/8bit";
import { IndexedImage } from "shared/lib/tiles/indexedImage";
import { autoFlipTiles } from "shared/lib/tiles/autoFlip";
import { padArrayEnd } from "shared/lib/helpers/array";
import {
  imageTileAllocationColorOnly,
  imageTileAllocationDefault,
} from "lib/compiler/tileAllocation";

const MAX_IMAGE_WIDTH = 255 * TILE_SIZE;
const MAX_IMAGE_HEIGHT = 255 * TILE_SIZE;
const MAX_PIXELS = MAX_SCENE_TILE_COUNT * TILE_SIZE * TILE_SIZE;
const BLANK_TILE = new Uint8Array(16);

type PrecompiledBackgroundData = Background & {
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

const readCommonTileset = async (
  commonTileset: Tileset | undefined,
  projectPath: string,
) => {
  if (!commonTileset) {
    return [];
  }
  const commonFilename = assetFilename(projectPath, "tilesets", commonTileset);
  const commonTileData = await readFileToTilesDataArray(commonFilename);
  return commonTileData;
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

const buildImageData = (
  indexedImage: IndexedImage,
  tileColors: number[],
  commonTileData: Uint8Array[],
  imgTileFlipEnabled: boolean,
): {
  tileData: Uint8Array[];
  tileAttrs: number[];
  tilesetData: Uint8Array[];
} => {
  if (imgTileFlipEnabled) {
    return autoFlipTiles({
      indexedImage,
      tileColors,
      commonTileData,
    });
  }

  const tileData = indexedImageToTilesDataArray(indexedImage);
  return {
    tileData,
    tileAttrs: tileColors,
    tilesetData: [...commonTileData, ...tileData],
  };
};

export const compileImage = async (
  img: Background,
  commonTileset: Tileset | undefined,
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

  const commonTileData = await readCommonTileset(commonTileset, projectPath);

  const { tileData, tileAttrs, tilesetData } = buildImageData(
    indexedImage,
    img.tileColors,
    commonTileData,
    imgTileFlipEnabled,
  );

  if (is360) {
    const sourceWidth = Math.ceil(indexedImage.width / TILE_SIZE);
    const logoTileCount = SCREEN_WIDTH * SCREEN_HEIGHT;
    const sourceAttrs = buildAttr(tileAttrs, autoTileColors, tileData.length);
    const logoTiles = Array.from({ length: logoTileCount }, (_, index) => {
      const x = index % SCREEN_WIDTH;
      const y = Math.floor(index / SCREEN_WIDTH);
      return tileData[y * sourceWidth + x] ?? BLANK_TILE;
    });
    const attr = Array.from({ length: logoTileCount }, (_, index) => {
      const x = index % SCREEN_WIDTH;
      const y = Math.floor(index / SCREEN_WIDTH);
      return sourceAttrs[y * sourceWidth + x] ?? 0;
    });
    const tilemap = Array.from({ length: logoTileCount }, (_, index) => index);
    const tiles = tileArrayToTileData(logoTiles);
    return {
      ...img,
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      vramData: [[...tiles], []],
      tilemap,
      attr,
      autoPalettes,
      is360,
      colorMode,
      tilesetLength: logoTileCount,
    };
  }

  const tilesetLookup = toTileLookup(tilesetData) ?? {};
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
    const { inVRAM2 } = tileAllocationStrategy(i, tiles.length);
    vramData[inVRAM2 ? 1 : 0].push(...tile);
  });

  // Determine tilemap attrs
  const attr = buildAttr(tileAttrs, autoTileColors, tilemap.length).map(
    (attr, index) => {
      const tile = tilemap[index];
      const { inVRAM2, tileIndex } = tileAllocationStrategy(
        tile,
        uniqueTiles.length,
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
  commonTilesetsLookup: Record<string, Tileset[]>,
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
