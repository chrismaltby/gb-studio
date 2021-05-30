import { Middleware } from "@reduxjs/toolkit";
import { RootState } from "../../configureStore";
import migrateWarning from "../../../lib/project/migrateWarning";
import actions from "./projectActions";

const projectMiddleware: Middleware<{}, RootState> = (store) => (
  next
) => async (action) => {
  if (actions.openProject.match(action)) {
    const shouldOpenProject = await migrateWarning(action.payload);

    if (!shouldOpenProject) {
      store.dispatch(actions.closeProject());
      return;
    }

    actions.loadProject(action.payload)(store.dispatch, store.getState, {});
  }

  // Run the reducers first so we can clear the project stack after loading
  next(action);
};

export default projectMiddleware;
