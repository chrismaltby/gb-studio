import { ipcRenderer } from "electron";
import { OPEN_HELP } from "../actions/actionTypes";

export default store => next => action => {
  if (action.type === OPEN_HELP) {
    ipcRenderer.send("open-help", action.page);
  }

  let result = next(action);
  return result;
};
