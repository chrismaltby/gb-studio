import { Dispatch, Middleware } from "@reduxjs/toolkit";
import { RootState } from "store/configureStore";
import consoleActions from "store/features/console/consoleActions";
import debuggerActions from "store/features/debugger/debuggerActions";
import settingsActions from "store/features/settings/settingsActions";
import { denormalizeProject } from "store/features/project/projectActions";
import actions from "./buildGameActions";
import API from "renderer/lib/api";
import navigationActions from "store/features/navigation/navigationActions";

const buildGameMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => async (action) => {
    if (actions.buildGame.match(action)) {
      const state = store.getState();
      const dispatch = store.dispatch.bind(store);

      const { buildType, exportBuild, debugEnabled } = action.payload;

      if (state.console.status === "cancelled") {
        // Wait until cancel is complete before allowing another build
        return;
      }
      if (state.console.status === "running") {
        // Stop build if already building
        store.dispatch(consoleActions.cancelConsole());
        await API.project.buildCancel();
        return;
      }

      dispatch(consoleActions.startConsole());

      const project = denormalizeProject(state.project.present);
      const engineFields = state.engine.fields;
      const sceneTypes = state.engine.sceneTypes;

      try {
        await API.project.build(project, {
          buildType,
          engineFields,
          exportBuild,
          debugEnabled,
          sceneTypes,
        });
      } catch (e) {
        dispatch(settingsActions.editSettings({ debuggerEnabled: true }));
        dispatch(navigationActions.setSection("world"));
        dispatch(debuggerActions.setIsLogOpen(true));
      }
      dispatch(consoleActions.completeConsole());
    } else if (actions.deleteBuildCache.match(action)) {
      const dispatch = store.dispatch.bind(store);
      await API.app.deleteBuildCache();
      dispatch(consoleActions.clearConsole());
      dispatch(consoleActions.stdOut("Cleared GB Studio caches"));
    } else if (actions.ejectEngine.match(action)) {
      API.project.ejectEngine();
    } else if (actions.exportProject.match(action)) {
      const state = store.getState();
      const dispatch = store.dispatch.bind(store);

      if (state.console.status === "running") {
        // Stop build if already building
        return;
      }
      const exportType = action.payload;
      dispatch(consoleActions.startConsole());

      const project = denormalizeProject(state.project.present);
      const engineFields = state.engine.fields;
      const sceneTypes = state.engine.sceneTypes;

      try {
        await API.project.exportProject(
          project,
          engineFields,
          sceneTypes,
          exportType
        );
      } catch (e) {
        dispatch(settingsActions.editSettings({ debuggerEnabled: true }));
        dispatch(navigationActions.setSection("world"));
        dispatch(debuggerActions.setIsLogOpen(true));
      }

      dispatch(consoleActions.completeConsole());
    }

    return next(action);
  };

export default buildGameMiddleware;
