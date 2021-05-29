import { Dispatch, Middleware } from "@reduxjs/toolkit";
import Path from "path";
import { RootState } from "store/configureStore";
import migrateWarning from "lib/project/migrateWarning";
import actions from "./projectActions";
import { AssetFolder, potentialAssetFolders } from "lib/project/assets";
import { copyFile } from "fs-extra";
import confirmAssetFolder from "lib/electron/dialog/confirmAssetFolder";

const projectMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => async (action) => {
    if (actions.openProject.match(action)) {
      const shouldOpenProject = await migrateWarning(action.payload);

      if (!shouldOpenProject) {
        store.dispatch(actions.closeProject());
        return;
      }

      actions.loadProject(action.payload)(store.dispatch, store.getState, {});
    } else if (actions.addFileToProject.match(action)) {
      const filename = action.payload;
      const projectRoot = store.getState().document.root;
      const folders = await potentialAssetFolders(filename);

      if (folders.length > 0) {
        let copyFolder: AssetFolder | undefined = folders[0];

        if (folders.length > 1) {
          copyFolder = await confirmAssetFolder(folders);
        }

        if (copyFolder) {
          const destPath = `${projectRoot}/assets/${copyFolder}/${Path.basename(
            filename
          )}`;

          const isInProject = Path.relative(filename, destPath) === "";

          if (!isInProject) {
            await copyFile(filename, destPath);
          }
        }
      }
    }

    // Run the reducers first so we can clear the project stack after loading
    next(action);
  };

export default projectMiddleware;
