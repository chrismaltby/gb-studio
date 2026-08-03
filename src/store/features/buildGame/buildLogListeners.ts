import type { ListenerMiddlewareInstance } from "@reduxjs/toolkit";
import consoleActions from "store/features/console/consoleActions";
import debuggerActions from "store/features/debugger/debuggerActions";
import navigationActions from "store/features/navigation/navigationActions";
import settingsActions from "store/features/settings/settingsActions";
import type { RootState } from "store/storeTypes";

type StartAppListening =
  ListenerMiddlewareInstance<RootState>["startListening"];

export const registerBuildLogListeners = (
  startListening: StartAppListening,
) => {
  startListening({
    actionCreator: consoleActions.stdErr,
    effect: (_action, listenerApi) => {
      if (
        !listenerApi.getState().project.present.settings.openBuildLogOnWarnings
      ) {
        return;
      }

      listenerApi.dispatch(
        settingsActions.editSettings({ debuggerEnabled: true }),
      );
      listenerApi.dispatch(navigationActions.setSection("world"));
      listenerApi.dispatch(debuggerActions.setIsLogOpen(true));
    },
  });

  startListening({
    actionCreator: consoleActions.appendMany,
    effect: (action, listenerApi) => {
      if (
        !action.payload.some((item) => item.type === "err") ||
        !listenerApi.getState().project.present.settings.openBuildLogOnWarnings
      ) {
        return;
      }

      listenerApi.dispatch(
        settingsActions.editSettings({ debuggerEnabled: true }),
      );
      listenerApi.dispatch(navigationActions.setSection("world"));
      listenerApi.dispatch(debuggerActions.setIsLogOpen(true));
    },
  });
};
