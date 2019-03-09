import { ipcRenderer, remote, shell } from "electron";
import uuid from "uuid/v4";
import fs from "fs-extra";
import buildProject from "../lib/compiler/buildProject";
import {
  BUILD_GAME,
  SET_SECTION,
  CMD_START,
  CMD_COMPLETE,
  CMD_STD_OUT,
  CMD_STD_ERR
} from "../actions/actionTypes";
import path from "path";

const buildUUID = uuid();

export default store => next => async action => {
  if (action.type === BUILD_GAME) {
    const { buildType, exportBuild, ejectBuild } = action;
    const dispatch = store.dispatch.bind(store);

    dispatch({ type: CMD_START });
    dispatch({ type: SET_SECTION, section: "build" });
    try {
      const state = store.getState();
      const projectRoot = state.document && state.document.root;
      const project = state.project.present;
      const outputRoot = path.normalize(
        remote.app.getPath("temp") + "/" + buildUUID
      );

      await buildProject(project, {
        projectRoot,
        buildType,
        outputRoot,
        tmpPath: remote.app.getPath("temp"),
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
        await fs.copy(
          `${outputRoot}/build/${buildType}`,
          `${projectRoot}/build/${buildType}`
        );
        if (buildType === "rom") {
          shell.showItemInFolder(`${projectRoot}/build/${buildType}/game.gb`);
        } else if (buildType === "web") {
          shell.showItemInFolder(
            `${projectRoot}/build/${buildType}/index.html`
          );
        } else {
          shell.showItemInFolder(`${projectRoot}/build/${buildType}`);
        }
      } else if (ejectBuild) {
        await fs.copy(`${outputRoot}`, `${projectRoot}/eject`);
        shell.showItemInFolder(`${projectRoot}/eject`);
      }

      dispatch({ type: CMD_COMPLETE });

      if (buildType === "web" && !exportBuild && !ejectBuild) {
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
        dispatch({ type: CMD_STD_ERR, text: e });
      } else {
        dispatch({ type: CMD_STD_ERR, text: e.toString() });
      }
      dispatch({ type: CMD_COMPLETE });
      throw e;
    }
  }

  return next(action);
};
