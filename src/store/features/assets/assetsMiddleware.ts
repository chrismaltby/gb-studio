import { Middleware, Action, Dispatch } from "@reduxjs/toolkit";
import actions from "./assetsActions";
import { RootState } from "store/configureStore";
import {
  backgroundSelectors,
  tilesetSelectors,
} from "store/features/entities/entitiesState";
import API from "renderer/lib/api";

const assetsMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => (action: Action) => {
    if (actions.loadBackgroundAssetInfo.match(action)) {
      const state = store.getState();
      const background = backgroundSelectors.selectById(
        state,
        action.payload.backgroundId
      );
      const tileset = tilesetSelectors.selectById(
        state,
        action.payload.tilesetId ?? ""
      );
      const tilesetId = tileset?.id;

      const isCGBOnly = state.project.present.settings.colorMode === "color";

      if (background) {
        const cachedWarnings =
          state.assets.backgrounds[action.payload.backgroundId];
        if (
          !cachedWarnings ||
          cachedWarnings.timestamp < background._v ||
          cachedWarnings.is360 !== action.payload.is360 ||
		  cachedWarnings.allocationStrat !== action.payload.allocationStrat || 
          cachedWarnings.isCGBOnly !== isCGBOnly ||
          cachedWarnings.tilesetId !== tilesetId
        ) {
          API.project
            .getBackgroundInfo(
              background,
              tileset,
              action.payload.is360,
			  action.payload.allocationStrat,
              isCGBOnly
            )
            .then((info) => {
              store.dispatch(
                actions.setBackgroundAssetInfo({
                  id: action.payload.backgroundId,
                  is360: action.payload.is360,
				  allocationStrat: action.payload.allocationStrat,
                  tilesetId,
                  warnings: info.warnings,
                  numTiles: info.numTiles,
                  lookup: info.lookup,
                  isCGBOnly,
                })
              );
            });
        }
      }
    }
    return next(action);
  };

export default assetsMiddleware;
