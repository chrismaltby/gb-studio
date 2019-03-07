import { ipcRenderer, shell } from "electron";
import { OPEN_HELP, OPEN_FOLDER } from "../actions/actionTypes";

export default store => next => action => {
  if (action.type === OPEN_HELP) {
    ipcRenderer.send("open-help", action.page);
  } else if (action.type === OPEN_FOLDER) {
    shell.showItemInFolder(action.path);
  }

  let result = next(action);
  return result;
};
