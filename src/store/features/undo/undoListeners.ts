import type { ListenerMiddlewareInstance } from "@reduxjs/toolkit";
import { ActionCreators } from "redux-undo";
import projectActions from "store/features/project/projectActions";
import type { RootState } from "store/storeTypes";

type StartAppListening =
  ListenerMiddlewareInstance<RootState>["startListening"];

export const registerUndoListeners = (startListening: StartAppListening) => {
  startListening({
    actionCreator: projectActions.loadProject.fulfilled,
    effect: (_action, listenerApi) => {
      listenerApi.dispatch(ActionCreators.clearHistory());
    },
  });
};
