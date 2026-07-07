import { compileImage } from "lib/compiler/compileImages";
import compileSceneTilemaps from "lib/compiler/compileSceneTilemaps";
import {
  Background,
  ColorCorrectionSetting,
  ColorModeSetting,
  Palette,
  TilesetAsset,
  Scene,
  Tileset,
} from "shared/lib/resources/types";
import { HexPalette } from "shared/lib/tiles/autoColor";
import { SceneNormalized } from "shared/lib/entities/entitiesTypes";

export interface BackgroundInfo {
  numTiles: number;
  warnings: string[];
  lookup: number[];
  autoPalettes?: Palette[];
  attr: number[];
}

export const getBackgroundInfo = async (
  background: Background,
  commonTileset: TilesetAsset | undefined,
  is360: boolean,
  uiPalette: HexPalette | undefined,
  colorMode: ColorModeSetting,
  colorCorrection: ColorCorrectionSetting,
  autoTileFlipEnabled: boolean,
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
      autoTileFlipEnabled,
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

export interface SceneTilemapInfo {
  numTiles: number;
  warnings: string[];
}

export const getSceneTilemapInfo = async (
  scene: SceneNormalized,
  tilesets: Tileset[],
  colorMode: ColorModeSetting,
  autoTileFlipEnabled: boolean,
  projectPath: string,
): Promise<SceneTilemapInfo> => {
  const warnings: string[] = [];
  try {
    const tilesetsLookup = Object.fromEntries(
      tilesets.map((tileset) => [tileset.id, tileset]),
    );
    const [result] = await compileSceneTilemaps(
      [scene as unknown as Scene],
      tilesetsLookup,
      colorMode,
      projectPath,
      autoTileFlipEnabled,
      { warnings: (msg) => warnings.push(msg) },
    );
    return { numTiles: result?.tilesetLength ?? 0, warnings };
  } catch (e) {
    warnings.push(String(e));
    return { numTiles: 0, warnings };
  }
};
