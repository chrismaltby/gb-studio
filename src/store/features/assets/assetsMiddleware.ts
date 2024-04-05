import { Middleware, Action, Dispatch } from "@reduxjs/toolkit";
import actions from "./assetsActions";
import { RootState } from "store/configureStore";
import { backgroundSelectors } from "store/features/entities/entitiesState";
import API from "renderer/lib/api";

const assetsMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => (action: Action) => {
    if (actions.loadBackgroundAssetInfo.match(action)) {
      const state = store.getState();
      const backgroundsLookup = backgroundSelectors.selectEntities(state);
      const background = backgroundsLookup[action.payload.backgroundId];
      const isCGBOnly = state.project.present.settings.colorMode === "color";

      if (background) {
        const cachedWarnings =
          state.assets.backgrounds[action.payload.backgroundId];
        if (
          !cachedWarnings ||
          cachedWarnings.timestamp < background._v ||
          cachedWarnings.is360 !== action.payload.is360 ||
          cachedWarnings.isCGBOnly !== isCGBOnly
        ) {
          API.project
            .getBackgroundInfo(background, action.payload.is360, isCGBOnly)
            .then((info) => {
              store.dispatch(
                actions.setBackgroundAssetInfo({
                  id: action.payload.backgroundId,
                  is360: action.payload.is360,
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
