import { Dispatch, Middleware } from "@reduxjs/toolkit";
import { RootState } from "store/configureStore";
import settingsActions from "./settingsActions";

const settingsMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => (action) => {
    next(action);

    // When color mode changes reset previewAsMono to false
    if (
      settingsActions.editSettings.match(action) &&
      action.payload.colorMode
    ) {
      store.dispatch(
        settingsActions.editSettings({
          previewAsMono: false,
        })
      );
    }
  };

export default settingsMiddleware;
