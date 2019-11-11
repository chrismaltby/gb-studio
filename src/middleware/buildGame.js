import { ipcRenderer, remote } from "electron";
import uuid from "uuid/v4";
import Path from "path";
import buildProject from "../lib/compiler/buildProject";
import {
  BUILD_GAME,
  SET_SECTION,
  CMD_START,
  CMD_COMPLETE,
  CMD_STD_OUT,
  CMD_STD_ERR
} from "../actions/actionTypes";
import copy from "../lib/helpers/fsCopy";
import { denormalizeProject } from "../reducers/entitiesReducer";
import getTmp from "../lib/helpers/getTmp";

const buildUUID = uuid();

export default store => next => async action => {
  if (action.type === BUILD_GAME) {
    const { buildType, exportBuild, ejectBuild } = action;
    const dispatch = store.dispatch.bind(store);

    dispatch({ type: CMD_START });
    try {
      const state = store.getState();
      const projectRoot = state.document && state.document.root;
      const project = denormalizeProject(state.entities.present);
      const outputRoot = Path.normalize(`${getTmp()}/${buildUUID}`);

      await buildProject(project, {
        projectRoot,
        buildType,
        outputRoot,
        tmpPath: getTmp(),
        progress: message => {
          if (
            message !== "'" &&
            message.indexOf("unknown or unsupported #pragma") === -1
          ) {
            dispatch({ type: CMD_STD_OUT, text: message });
          }
        },
        warnings: message => {
          dispatch({ type: CMD_STD_ERR, text: message });
        }
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
        await copy(`${outputRoot}`, `${projectRoot}/eject`);
        remote.shell.openItem(`${projectRoot}/eject`);
      }

      dispatch({ type: CMD_COMPLETE });

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

      return {
        outputRoot
      };
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
  }

  return next(action);
};
