import { ipcRenderer } from "electron";
import {
  BUILD_GAME,
} from "../actions/actionTypes";
import { denormalizeProject } from "../reducers/entitiesReducer";

export default store => next => async action => {
  if (action.type === BUILD_GAME) {
    const { buildType, exportBuild, ejectBuild } = action;
    const state = store.getState();
    const projectRoot = state.document && state.document.root;
    const project = denormalizeProject(state.entities.present);
    ipcRenderer.send("build-game", project, projectRoot, buildType, exportBuild, ejectBuild);
  }
  return next(action);
};
