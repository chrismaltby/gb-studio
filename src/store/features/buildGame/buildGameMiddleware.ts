import { Dispatch, Middleware } from "@reduxjs/toolkit";
import { RootState } from "store/storeTypes";
import consoleActions from "store/features/console/consoleActions";
import debuggerActions from "store/features/debugger/debuggerActions";
import settingsActions from "store/features/settings/settingsActions";
import navigationActions from "store/features/navigation/navigationActions";

const openBuildLogForWarning = (dispatch: Dispatch) => {
  dispatch(settingsActions.editSettings({ debuggerEnabled: true }));
  dispatch(navigationActions.setSection("world"));
  dispatch(debuggerActions.setIsLogOpen(true));
};

const buildGameMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => (action) => {
    if (consoleActions.stdErr.match(action)) {
      const state = store.getState();
      const dispatch = store.dispatch.bind(store);
      if (state.project.present.settings.openBuildLogOnWarnings) {
        openBuildLogForWarning(dispatch);
      }
    } else if (consoleActions.appendMany.match(action)) {
      const state = store.getState();
      const dispatch = store.dispatch.bind(store);
      if (
        state.project.present.settings.openBuildLogOnWarnings &&
        action.payload.some((item) => item.type === "err")
      ) {
        openBuildLogForWarning(dispatch);
      }
    }

    return next(action);
  };

export default buildGameMiddleware;
