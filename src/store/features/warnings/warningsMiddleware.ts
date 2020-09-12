import { Middleware, Action } from "@reduxjs/toolkit";
import { getBackgroundWarnings } from "../../../lib/helpers/validation";
import actions from "./warningsActions";
import { RootState } from "../../configureStore";
import { backgroundSelectors } from "../entities/entitiesState";

const warningsMiddleware: Middleware<{}, RootState> = (store) => (next) => (
  action: Action
) => {
  if (actions.checkBackgroundWarnings.match(action)) {
    const state = store.getState();
    const backgroundsLookup = backgroundSelectors.selectEntities(state);
    const background = backgroundsLookup[action.payload];
    const projectRoot = state.document.root;

    if (background) {
      const cachedWarnings = state.warnings.backgrounds[action.payload];
      if (!cachedWarnings || cachedWarnings.timestamp < background._v) {
        getBackgroundWarnings(background, projectRoot).then((warnings) => {
          store.dispatch(
            actions.setBackgroundWarnings({ id: action.payload, warnings })
          );
        });
      }
    }
  }
  return next(action);
};

export default warningsMiddleware;
