import { CHECK_BACKGROUND_WARNINGS } from "../actions/actionTypes";
import { getBackgroundWarnings } from "../lib/helpers/validation";
import { setBackgroundWarnings } from "../actions";

export default (store) => (next) => (action) => {
  if (action.type === CHECK_BACKGROUND_WARNINGS) {
    const state = store.getState();

    const backgroundsLookup = state.entities.present.entities.backgrounds;
    const background = backgroundsLookup[action.id];
    const projectRoot = state.document.root;

    if (background) {
      const cachedWarnings = state.warnings.backgrounds[action.id];
      if (!cachedWarnings || cachedWarnings.timestamp < background._v) {
        getBackgroundWarnings(background, projectRoot).then((warnings) => {
          store.dispatch(setBackgroundWarnings(action.id, warnings));
        });
      }
    }
  }
  return next(action);
};
