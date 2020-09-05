import { ipcRenderer, remote } from "electron";
import Path from "path";
import rimraf from "rimraf";
import { promisify } from "util";
import {
  BUILD_GAME,
  SET_SECTION
} from "../actions/actionTypes";
import copy from "../lib/helpers/fsCopy";
import { denormalizeProject } from "../reducers/entitiesReducer";
import getTmp from "../lib/helpers/getTmp";

import { startConsole, stdOut, clearConsole, stdErr, completeConsole } from "../store/features/console/consoleSlice";

const rmdir = promisify(rimraf);

const buildUUID = "_gbsbuild";

export default store => next => async action => {
  if (action.type === BUILD_GAME) {
    const { buildType, exportBuild, ejectBuild } = action;
    const dispatch = store.dispatch.bind(store);
    const buildStartTime = Date.now();

    dispatch(startConsole());

    try {
      const state = store.getState();
      const projectRoot = state.document && state.document.root;
      const project = denormalizeProject(state.entities.present);  
      const outputRoot = Path.normalize(`${getTmp()}/${buildUUID}`);

      await rmdir(outputRoot);
  
      const buildProject = await import("../lib/compiler/buildProject").then((module) => module.default);

      await buildProject(project, {
        projectRoot,
        buildType,
        outputRoot,
        tmpPath: getTmp(),
        profile: state.editor.profile,
        progress: (message) => {
          if (
            message !== "'" &&
            message.indexOf("unknown or unsupported #pragma") === -1
          ) {
            dispatch(stdOut(message));
          }
        },
        warnings: (message) => {
          dispatch(stdErr(message));
        },
      });
  
      if (exportBuild) {
        await copy(
          `${outputRoot}/build/${buildType}`,
          `${projectRoot}/build/${buildType}`
        );
        remote.shell.openItem(`${projectRoot}/build/${buildType}`);
        dispatch(stdOut("-"))
        dispatch(stdOut(`Success! ${
          buildType === "web"
            ? `Site is ready at ${Path.normalize(
                `${projectRoot}/build/web/index.html`
              )}`
            : `ROM is ready at ${Path.normalize(
                `${projectRoot}/build/rom/game.gb`
              )}`
        }`));
      } else if (ejectBuild) {
        await copy(`${outputRoot}`, `${projectRoot}/build/src`);
        remote.shell.openItem(`${projectRoot}/build/src`);
      }

      if (buildType === "web" && !exportBuild && !ejectBuild) {
        dispatch(stdOut("-"))
        dispatch(stdOut("Success! Starting emulator..."))

        ipcRenderer.send(
          "open-play",
          `file://${outputRoot}/build/web/index.html`
        );
      }
  
      const buildTime = Date.now() - buildStartTime;

      dispatch(stdOut(`Build Time: ${buildTime}ms`))
      dispatch(completeConsole());

    } catch (e) {
      if (typeof e === "string") {
        dispatch({ type: SET_SECTION, section: "build" });
        dispatch(stdErr(e));
      } else {
        dispatch({ type: SET_SECTION, section: "build" });
        dispatch(stdErr(e.toString()));
      }
      dispatch(completeConsole());
      throw e;
    }

    if(module.hot) {  
      module.hot.accept("../lib/compiler/buildProject", () => {
        dispatch(clearConsole());
        dispatch(stdOut("Reloaded GB Studio Compiler"));     
      });
    }    
  }

  return next(action);
};

if(module.hot) {
  module.hot.accept("../lib/compiler/buildProject");
}   
