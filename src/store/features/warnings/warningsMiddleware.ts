import { Middleware, Action } from "@reduxjs/toolkit";
import { getBackgroundWarnings } from "../../../lib/helpers/validation";
import {
  setBackgroundWarnings,
  checkBackgroundWarnings,
} from "./warningsSlice";
import { RootState } from "../../configureStore";
import { backgroundSelectors } from "../entities/entitiesSlice";

const warningsMiddleware: Middleware<{}, RootState> = (store) => (next) => (
  action: Action
) => {
  if (checkBackgroundWarnings.match(action)) {
    const state = store.getState();
    const backgroundsLookup = backgroundSelectors.selectEntities(
      state.project.present.entities
    );
    const background = backgroundsLookup[action.payload];
    const projectRoot = state.document.root;

    if (background) {
      const cachedWarnings = state.warnings.backgrounds[action.payload.id];
      if (!cachedWarnings || cachedWarnings.timestamp < background._v) {
        getBackgroundWarnings(background, projectRoot).then((warnings) => {
          store.dispatch(
            setBackgroundWarnings({ id: action.payload, warnings })
          );
        });
      }
    }
  }
  return next(action);
};

export default warningsMiddleware;
