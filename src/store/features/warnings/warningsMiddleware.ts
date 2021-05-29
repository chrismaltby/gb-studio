import { Middleware, Action, Dispatch } from "@reduxjs/toolkit";
import { getBackgroundInfo } from "lib/helpers/validation";
import actions from "./warningsActions";
import { RootState } from "store/configureStore";
import { backgroundSelectors } from "../entities/entitiesState";

const warningsMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => (action: Action) => {
    if (actions.checkBackgroundWarnings.match(action)) {
      const state = store.getState();
      const backgroundsLookup = backgroundSelectors.selectEntities(state);
      const background = backgroundsLookup[action.payload.backgroundId];
      const projectRoot = state.document.root;

      if (background) {
        const cachedWarnings =
          state.warnings.backgrounds[action.payload.backgroundId];
        if (
          !cachedWarnings ||
          cachedWarnings.timestamp < background._v ||
          cachedWarnings.is360 !== action.payload.is360
        ) {
          getBackgroundInfo(background, action.payload.is360, projectRoot).then(
            (info) => {
              store.dispatch(
                actions.setBackgroundWarnings({
                  id: action.payload.backgroundId,
                  is360: action.payload.is360,
                  warnings: info.warnings,
                  numTiles: info.numTiles,
                })
              );
            }
          );
        }
      }
    }
    return next(action);
  };

export default warningsMiddleware;
