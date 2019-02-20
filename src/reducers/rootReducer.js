import { combineReducers } from "redux";
import undoable, { distinctState } from 'redux-undo';
import tools from "./toolsReducer";
import project from "./projectReducer";
import editor from "./editorReducer";
import navigation from "./navigationReducer";
import document from "./documentReducer";
import console from "./consoleReducer";
import { PROJECT_LOAD_SUCCESS, PROJECT_SAVE_SUCCESS } from "../actions/actionTypes";

let lastUndoStateTime = 0;
const UNDO_THROTTLE = 2000;

const rootReducer = combineReducers({
  tools,
  editor,
  project: undoable(project, {
    limit: 50,
    filter: (action, currentState, previousState) => {
      const shouldStoreUndo = currentState !== previousState && (Date.now() > lastUndoStateTime + UNDO_THROTTLE);
      if (shouldStoreUndo) {
        lastUndoStateTime = Date.now();
      }
      return shouldStoreUndo;
    },
    initTypes: [
      '@@redux/INIT',
      '@@INIT',
      PROJECT_LOAD_SUCCESS,
      PROJECT_SAVE_SUCCESS
    ]
  }),
  document,
  navigation,
  console
});

export default rootReducer;
