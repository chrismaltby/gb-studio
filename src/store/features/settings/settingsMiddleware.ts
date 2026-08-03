import { Dispatch, Middleware } from "@reduxjs/toolkit";
import { RootState } from "store/storeTypes";
import settingsActions from "./settingsActions";
import { getSettings } from "store/features/settings/settingsState";
import { defaultProjectSettings } from "consts";

const settingsMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => (action) => {
    const result = next(action);

    if (settingsActions.editSettings.match(action)) {
      // When color mode changes reset previewAsMono to false
      if (action.payload.colorMode) {
        store.dispatch(
          settingsActions.editSettings({
            previewAsMono: false,
          }),
        );
      }
      // When collisions enabled set opacity to a min of 50%
      if (action.payload.showCollisions) {
        const state = store.getState();
        const settings = getSettings(state);
        const defaultOpacity = defaultProjectSettings.collisionLayerOpacity;
        if (settings.collisionLayerOpacity < defaultOpacity) {
          store.dispatch(
            settingsActions.editSettings({
              collisionLayerOpacity: defaultOpacity,
            }),
          );
        }
      }
    }

    return result;
  };

export default settingsMiddleware;
