import l10n from "shared/lib/lang/l10n";
import Path from "path";
import { divisibleBy8 } from "shared/lib/helpers/8bit";
import type {
  BackgroundData,
  Tileset,
} from "shared/lib/entities/entitiesTypes";
import {
  toTileLookup,
  tilesAndLookupToTilemap,
} from "shared/lib/tiles/tileData";
import { assetFilename } from "shared/lib/helpers/assets";
import { readFileToTilesDataArray } from "lib/tiles/readFileToTiles";
import { MAX_BACKGROUND_TILES, MAX_BACKGROUND_TILES_CGB, UI_TILE_LENGTH } from "consts";

const MAX_IMAGE_WIDTH = 2040;
const MAX_IMAGE_HEIGHT = 2040;
const MAX_PIXELS = 16380 * 64;

export interface BackgroundInfo {
  numTiles: number;
  warnings: string[];
  lookup: number[];
}

const mergeCommonTiles = async (
  tileData: Uint8Array[],
  commonTileset: Tileset | undefined,
  projectPath: string
) => {
  if (!commonTileset) {
    return tileData;
  }
  const commonFilename = assetFilename(projectPath, "tilesets", commonTileset);
  const commonTileData = await readFileToTilesDataArray(commonFilename);
  return [...commonTileData, ...tileData];
};

export const getBackgroundInfo = async (
  background: BackgroundData,
  commonTileset: Tileset | undefined,
  is360: boolean,
  allocationStrat: number,
  isCGBOnly: boolean,
  projectPath: string,
  precalculatedTilesetLength?: number
): Promise<BackgroundInfo> => {
  const warnings: string[] = [];

  let tilesetLength = precalculatedTilesetLength;
  let tilesets: number[] = [];

  try {
    if (!tilesetLength) {
      const filename = assetFilename(projectPath, "backgrounds", background);
      const tileData = await readFileToTilesDataArray(filename);
      const tileDataWithCommon = await mergeCommonTiles(
        tileData,
        commonTileset,
        projectPath
      );
      const tilesetLookup = toTileLookup(tileDataWithCommon);
      tilesets = tilesAndLookupToTilemap(tileData, tilesetLookup);
      tilesetLength = Object.keys(tilesetLookup).length;
    }
  } catch (e) {
    warnings.push(String(e));
    return {
      warnings: [
        l10n("WARNING_BACKGROUND_IS_NOT_A_VALID_PNG", {
          filename: Path.relative(
            projectPath,
            assetFilename(projectPath, "backgrounds", background)
          ),
        }),
      ],
      numTiles: 0,
      lookup: [],
    };
  }

  if (background.imageWidth < 160 || background.imageHeight < 144) {
    warnings.push(l10n("WARNING_BACKGROUND_TOO_SMALL"));
  }
  if (background.imageWidth > MAX_IMAGE_WIDTH) {
    warnings.push(
      l10n("WARNING_BACKGROUND_TOO_WIDE", {
        width: background.imageWidth,
        maxWidth: MAX_IMAGE_WIDTH,
      })
    );
  }
  if (background.imageHeight > MAX_IMAGE_HEIGHT) {
    warnings.push(
      l10n("WARNING_BACKGROUND_TOO_TALL", {
        height: background.imageHeight,
        maxHeight: MAX_IMAGE_HEIGHT,
      })
    );
  }
  if (background.imageWidth * background.imageHeight > MAX_PIXELS) {
    warnings.push(
      l10n("WARNING_BACKGROUND_TOO_MANY_PIXELS", {
        width: background.imageWidth,
        height: background.imageHeight,
        numPixels: background.imageWidth * background.imageHeight,
        maxPixels: MAX_PIXELS,
      })
    );
  }
  if (
    !divisibleBy8(background.imageWidth) ||
    !divisibleBy8(background.imageHeight)
  ) {
    warnings.push(l10n("WARNING_BACKGROUND_NOT_MULTIPLE_OF_8"));
  }
  let max_bg_tiles = (MAX_BACKGROUND_TILES - (((allocationStrat >> 1) & 1)? 0: (UI_TILE_LENGTH)));
  if (tilesetLength > max_bg_tiles && !is360 && !isCGBOnly) {
    warnings.push(
      l10n("WARNING_BACKGROUND_TOO_MANY_TILES", {
        tilesetLength,
        maxTilesetLength: max_bg_tiles,
      })
    );
  }
  max_bg_tiles = (MAX_BACKGROUND_TILES_CGB - (((allocationStrat >> 1) & 1)? 0: (UI_TILE_LENGTH * 2)));
  if (tilesetLength > max_bg_tiles && !is360 && isCGBOnly) {
    warnings.push(
      l10n("WARNING_BACKGROUND_TOO_MANY_TILES", {
        tilesetLength,
        maxTilesetLength: max_bg_tiles,
      })
    );
  }

  if (
    is360 &&
    (background.imageWidth !== 160 || background.imageHeight !== 144)
  ) {
    warnings.push(
      l10n("WARNING_LOGO_WRONG_SIZE", {
        width: background.imageWidth,
        height: background.imageHeight,
      })
    );
  }
  return {
    warnings,
    numTiles: tilesetLength,
    lookup: tilesets,
  };
};
