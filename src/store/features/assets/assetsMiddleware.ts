import { Middleware, Dispatch } from "@reduxjs/toolkit";
import actions from "./assetsActions";
import { RootState } from "store/configureStore";
import {
  backgroundSelectors,
  tilesetSelectors,
} from "store/features/entities/entitiesState";
import API from "renderer/lib/api";
import { Background } from "shared/lib/entities/entitiesTypes";
import { HexPalette } from "shared/lib/tiles/autoColor";
import {
  ColorCorrectionSetting,
  ColorModeSetting,
} from "shared/lib/resources/types";
import { DMG_PALETTE } from "consts";

const generateAssetHash = (
  background: Background,
  is360: boolean,
  uiPaletteId: string,
  colorMode: ColorModeSetting,
  colorCorrection: ColorCorrectionSetting,
  tilesetId: string,
): string => {
  return `${background._v}_${is360}_${uiPaletteId}_${colorMode}_${colorCorrection}_${tilesetId}_${background.autoColor}`;
};

const assetsMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => (action) => {
    if (actions.loadBackgroundAssetInfo.match(action)) {
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

      const isCGBOnly = state.project.present.settings.colorMode === "color";
      const colorMode = state.project.present.settings.colorMode;
      const colorCorrection = state.project.present.settings.colorCorrection;
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
          tilesetId,
        );
        if (!cachedInfo || cachedInfo.hash !== hash) {
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
              background,
              tileset,
              is360,
              uiPalette,
              colorMode,
              colorCorrection,
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
            });
        }
      }
    }
    return next(action);
  };

export default assetsMiddleware;
