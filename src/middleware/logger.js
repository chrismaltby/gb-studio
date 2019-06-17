/* eslint-disable no-console */
import { SCENE_HOVER } from "../actions/actionTypes";

const ignoreTypes = [SCENE_HOVER];

const showLog = action => ignoreTypes.indexOf(action) === -1;

export default store => next => action => {
  if (showLog(action.type)) {
    console.group(action.type);
    console.info("dispatching", action);
    console.log("prev state", store.getState());
  }
  const result = next(action);
  if (showLog(action.type)) {
    console.log("next state", store.getState());
    console.groupEnd();
  }
  return result;
};
