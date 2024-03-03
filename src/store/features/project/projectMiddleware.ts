import { Dispatch, Middleware } from "@reduxjs/toolkit";
import { RootState } from "store/configureStore";
import actions from "./projectActions";
import API from "renderer/lib/api";

const projectMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => async (action) => {
    if (actions.openProject.match(action)) {
      const shouldOpenProject = await API.dialog.migrateWarning(action.payload);

      if (!shouldOpenProject) {
        store.dispatch(actions.closeProject());
        return;
      }

      actions.loadProject(action.payload)(store.dispatch, store.getState, {});
    } else if (actions.addFileToProject.match(action)) {
      const filename = action.payload;
      API.project.addFile(filename);
    }

    // Run the reducers first so we can clear the project stack after loading
    next(action);
  };

export default projectMiddleware;
