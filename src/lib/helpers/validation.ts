import type {
  BackgroundData,
  Palette,
  Tileset,
} from "shared/lib/entities/entitiesTypes";
import { compileImage } from "lib/compiler/compileImages";
import {
  ColorCorrectionSetting,
  ColorModeSetting,
} from "shared/lib/resources/types";
import { HexPalette } from "shared/lib/tiles/autoColor";

export interface BackgroundInfo {
  numTiles: number;
  warnings: string[];
  lookup: number[];
  autoPalettes?: Palette[];
  attr: number[];
}

export const getBackgroundInfo = async (
  background: BackgroundData,
  commonTileset: Tileset | undefined,
  is360: boolean,
  uiPalette: HexPalette | undefined,
  colorMode: ColorModeSetting,
  colorCorrection: ColorCorrectionSetting,
  projectPath: string,
): Promise<BackgroundInfo> => {
  const warnings: string[] = [];
  try {
    const result = await compileImage(
      background,
      commonTileset,
      is360,
      uiPalette,
      colorMode,
      colorCorrection,
      projectPath,
      { warnings: (msg) => warnings.push(msg) },
    );

    return {
      warnings,
      numTiles: result.tilesetLength,
      lookup: result.tilemap,
      autoPalettes: result.autoPalettes,
      attr: result.attr,
    };
  } catch (e) {
    warnings.push(String(e));
    return {
      warnings,
      numTiles: 0,
      lookup: [],
      autoPalettes: [],
      attr: [],
    };
  }
};
