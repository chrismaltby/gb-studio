import { ipcRenderer } from "electron";
import open from "open";
import {
  OPEN_HELP,
  OPEN_FOLDER,
  PROJECT_LOAD_SUCCESS
} from "../actions/actionTypes";

export default store => next => action => {
  if (action.type === OPEN_HELP) {
    ipcRenderer.send("open-help", action.page);
  } else if (action.type === OPEN_FOLDER) {
    open(action.path);
  } else if (action.type === PROJECT_LOAD_SUCCESS) {
    ipcRenderer.send("project-loaded", action.data);
  }

  return next(action);
};
