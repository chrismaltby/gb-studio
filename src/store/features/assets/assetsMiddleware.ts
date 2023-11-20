import { Middleware, Action, Dispatch } from "@reduxjs/toolkit";
import { getBackgroundInfo } from "lib/helpers/validation";
import actions from "./assetsActions";
import { RootState } from "store/configureStore";
import { backgroundSelectors } from "../entities/entitiesState";

const assetsMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => (action: Action) => {
    if (actions.loadBackgroundAssetInfo.match(action)) {
      const state = store.getState();
      const backgroundsLookup = backgroundSelectors.selectEntities(state);
      const background = backgroundsLookup[action.payload.backgroundId];
      const projectRoot = state.document.root;

      if (background) {
        const cachedWarnings =
          state.assets.backgrounds[action.payload.backgroundId];
        if (
          !cachedWarnings ||
          cachedWarnings.timestamp < background._v ||
          cachedWarnings.is360 !== action.payload.is360
        ) {
          getBackgroundInfo(background, action.payload.is360, projectRoot).then(
            (info) => {
              store.dispatch(
                actions.setBackgroundAssetInfo({
                  id: action.payload.backgroundId,
                  is360: action.payload.is360,
                  warnings: info.warnings,
                  numTiles: info.numTiles,
                  lookup: info.lookup,
                })
              );
            }
          );
        }
      }
    }
    return next(action);
  };

export default assetsMiddleware;
