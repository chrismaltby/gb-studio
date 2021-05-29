import l10n from "./l10n";
import { divisibleBy8 } from "./8bit";
import { assetFilename } from "./gbstudio";
import { Background } from "store/features/entities/entitiesTypes";
import { readFileToTilesDataArray, toTileLookup } from "../tiles/tileData";

const MAX_IMAGE_WIDTH = 2040;
const MAX_IMAGE_HEIGHT = 2040;
const MAX_PIXELS = 16380 * 64;
const MAX_TILESET_TILES = 16 * 12;

interface BackgroundInfo {
  numTiles: number;
  warnings: string[];
}

export const getBackgroundInfo = async (
  background: Background,
  is360: boolean,
  projectPath: string,
  precalculatedTilesetLength?: number
): Promise<BackgroundInfo> => {
  const warnings: string[] = [];

  let tilesetLength = precalculatedTilesetLength;
  if (!tilesetLength) {
    const filename = assetFilename(projectPath, "backgrounds", background);
    const tileData = await readFileToTilesDataArray(filename);
    const tilesetLookup = toTileLookup(tileData);
    tilesetLength = Object.keys(tilesetLookup).length;
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
  if (tilesetLength > MAX_TILESET_TILES && !is360) {
    warnings.push(
      l10n("WARNING_BACKGROUND_TOO_MANY_TILES", {
        tilesetLength,
        maxTilesetLength: MAX_TILESET_TILES,
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
  };
};
