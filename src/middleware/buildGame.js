import { ipcRenderer, remote } from "electron";
import uuid from "uuid/v4";
import Path from "path";
import {
  BUILD_GAME,
  SET_SECTION,
  CMD_START,
  CMD_COMPLETE,
  CMD_STD_OUT,
  CMD_STD_ERR,
  CMD_CLEAR
} from "../actions/actionTypes";
import copy from "../lib/helpers/fsCopy";
import { denormalizeProject } from "../reducers/entitiesReducer";
import getTmp from "../lib/helpers/getTmp";
import rimraf from "rimraf";
import { promisify } from "util";

const rmdir = promisify(rimraf);

const buildUUID = uuid();

export default store => next => async action => {
  if (action.type === BUILD_GAME) {
    const { buildType, exportBuild, ejectBuild } = action;
    const dispatch = store.dispatch.bind(store);
    const buildStartTime = Date.now();

    dispatch({ type: CMD_START });

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
        progress: (message) => {
          if (
            message !== "'" &&
            message.indexOf("unknown or unsupported #pragma") === -1
          ) {
            dispatch({ type: CMD_STD_OUT, text: message });
          }
        },
        warnings: (message) => {
          dispatch({ type: CMD_STD_ERR, text: message });
        },
      });
  
      if (exportBuild) {
        await copy(
          `${outputRoot}/build/${buildType}`,
          `${projectRoot}/build/${buildType}`
        );
        remote.shell.openItem(`${projectRoot}/build/${buildType}`);
        dispatch({
          type: CMD_STD_OUT,
          text: "-"
        });
        dispatch({
          type: CMD_STD_OUT,
          text: `Success! ${
            buildType === "web"
              ? `Site is ready at ${Path.normalize(
                  `${projectRoot}/build/web/index.html`
                )}`
              : `ROM is ready at ${Path.normalize(
                  `${projectRoot}/build/rom/game.gb`
                )}`
          }`
        });
      } else if (ejectBuild) {
        await copy(`${outputRoot}`, `${projectRoot}/build/src`);
        remote.shell.openItem(`${projectRoot}/build/src`);
      }

      if (buildType === "web" && !exportBuild && !ejectBuild) {
        dispatch({
          type: CMD_STD_OUT,
          text: "-"
        });
        dispatch({
          type: CMD_STD_OUT,
          text: "Success! Starting emulator..."
        });
        ipcRenderer.send(
          "open-play",
          `file://${outputRoot}/build/web/index.html`
        );
      }
  
      const buildTime = Date.now() - buildStartTime;

      dispatch({
        type: CMD_STD_OUT,
        text: `Build Time: ${buildTime}ms`
      });

      dispatch({ type: CMD_COMPLETE });      
    } catch (e) {
      if (typeof e === "string") {
        dispatch({ type: SET_SECTION, section: "build" });
        dispatch({ type: CMD_STD_ERR, text: e });
      } else {
        dispatch({ type: SET_SECTION, section: "build" });
        dispatch({ type: CMD_STD_ERR, text: e.toString() });
      }
      dispatch({ type: CMD_COMPLETE });
      throw e;
    }

    if(module.hot) {  
      module.hot.accept("../lib/compiler/buildProject", () => {
        dispatch({
          type: CMD_CLEAR
        });
        dispatch({
          type: CMD_STD_OUT,
          text: "Reloaded GB Studio Compiler"
        });        
      });
    }    
  }


  
  return next(action);
};

if(module.hot) {
  module.hot.accept("../lib/compiler/buildProject");
}   
