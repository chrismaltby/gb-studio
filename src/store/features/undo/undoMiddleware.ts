import { Dispatch, Middleware } from "@reduxjs/toolkit";
import { ActionCreators } from "redux-undo";
import { RootState } from "store/storeTypes";
import projectActions from "store/features/project/projectActions";

const undoMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => (action) => {
    // Run the reducers first so we can clear the undo stack after loading
    const result = next(action);

    if (projectActions.loadProject.fulfilled.match(action)) {
      store.dispatch(ActionCreators.clearHistory());
    }

    return result;
  };

export default undoMiddleware;
