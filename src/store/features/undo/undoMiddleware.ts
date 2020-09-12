import { Middleware } from "@reduxjs/toolkit";
import { ActionCreators } from "redux-undo";
import { RootState } from "../../configureStore";
import projectActions from "../project/projectActions";

const undoMiddleware: Middleware<{}, RootState> = (store) => (next) => (
  action
) => {
  // Run the reducers first so we can clear the undo stack after loading
  next(action);

  if (projectActions.loadProject.fulfilled.match(action)) {
    store.dispatch(ActionCreators.clearHistory());
  }
};

export default undoMiddleware;
