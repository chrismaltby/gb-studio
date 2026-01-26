import { Middleware, Dispatch } from "@reduxjs/toolkit";
import actions from "./assetsActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { RootState } from "store/configureStore";
import {
  backgroundSelectors,
  tilesetSelectors,
} from "store/features/entities/entitiesState";
import API from "renderer/lib/api";
import { HexPalette } from "shared/lib/tiles/autoColor";
import {
  BackgroundAsset,
  ColorCorrectionSetting,
  ColorModeSetting,
} from "shared/lib/resources/types";
import { DMG_PALETTE } from "consts";

const generateAssetHash = (
  background: BackgroundAsset,
  is360: boolean,
  uiPaletteId: string,
  colorMode: ColorModeSetting,
  colorCorrection: ColorCorrectionSetting,
  autoTileFlipEnabled: boolean,
  tilesetId: string,
): string => {
  return `${background._v}_${is360}_${uiPaletteId}_${colorMode}_${colorCorrection}_${tilesetId}_${background.autoColor}_${autoTileFlipEnabled}_${background.autoTileFlipOverride}`;
};

const assetsMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => (action) => {
    if (
      actions.loadBackgroundAssetInfo.match(action) ||
      actions.extractBackgroundAssetInfo.match(action)
    ) {
      const isExtracting = actions.extractBackgroundAssetInfo.match(action);
      const state = store.getState();
      const background = backgroundSelectors.selectById(
        state,
        action.payload.backgroundId,
      );
      const tileset = tilesetSelectors.selectById(
        state,
        action.payload.tilesetId ?? "",
      );
      const tilesetId = tileset?.id;

      const colorMode = action.payload.colorMode;
      const isCGBOnly = colorMode === "color";
      const colorCorrection = state.project.present.settings.colorCorrection;
      const autoTileFlipEnabled =
        state.project.present.settings.autoTileFlipEnabled;
      const is360 = action.payload.is360;
      const uiPaletteId = action.payload.uiPaletteId;

      if (background) {
        const cachedInfo =
          state.assets.backgrounds[action.payload.backgroundId];
        const hash = generateAssetHash(
          background,
          is360,
          uiPaletteId,
          colorMode,
          colorCorrection,
          autoTileFlipEnabled,
          tilesetId,
        );
        if (!cachedInfo || cachedInfo.hash !== hash || isExtracting) {
          const palette =
            uiPaletteId === "dmg"
              ? DMG_PALETTE
              : state.project.present.entities.palettes.entities[uiPaletteId] ||
                state.project.present.entities.palettes.entities[
                  state.project.present.settings.defaultBackgroundPaletteIds[7]
                ] ||
                DMG_PALETTE;
          const uiPalette: HexPalette | undefined =
            uiPaletteId !== "auto" ? palette?.colors : undefined;
          API.project
            .getBackgroundInfo(
              isExtracting ? { ...background, autoColor: true } : background,
              tileset,
              is360,
              uiPalette,
              colorMode,
              colorCorrection,
              autoTileFlipEnabled,
              isExtracting,
            )
            .then((info) => {
              store.dispatch(
                actions.setBackgroundAssetInfo({
                  id: action.payload.backgroundId,
                  is360: is360,
                  tilesetId,
                  warnings: info.warnings,
                  numTiles: info.numTiles,
                  lookup: info.lookup,
                  autoPalettes: info.autoPalettes,
                  isCGBOnly,
                  hash,
                }),
              );

              if (isExtracting && info.autoPalettes) {
                store.dispatch(
                  entitiesActions.setSceneExtractedPalettes({
                    sceneId: action.payload.sceneId,
                    palettes: info.autoPalettes,
                    tileColors: info.attr,
                  }),
                );
              }
            });
        }
      }
    }
    return next(action);
  };

export default assetsMiddleware;
