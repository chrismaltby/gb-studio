import { combineReducers } from "redux";
import undoable from "redux-undo";
import tools from "./toolsReducer";
import editor from "./editorReducer";
import navigation from "./navigationReducer";
import document from "./documentReducer";
import console from "./consoleReducer";
import music from "./musicReducer";
import entities from "./entitiesReducer";
import settings from "./settingsReducer";
import error from "./errorReducer";

import {
  PROJECT_LOAD_SUCCESS,
  PROJECT_SAVE_SUCCESS
} from "../actions/actionTypes";

let lastEntityUndoStateTime = 0;

const UNDO_THROTTLE = 2000;

const rootReducer = combineReducers({
  tools,
  editor,
  document,
  navigation,
  console,
  music,
  entities: undoable(entities, {
    limit: 50,
    filter: (_action, currentState, previousState) => {
      const shouldStoreUndo =
        currentState !== previousState &&
        Date.now() > lastEntityUndoStateTime + UNDO_THROTTLE;
      if (shouldStoreUndo) {
        lastEntityUndoStateTime = Date.now();
      }
      return shouldStoreUndo;
    },
    initTypes: [
      "@@redux/INIT",
      "@@INIT",
      PROJECT_LOAD_SUCCESS,
      PROJECT_SAVE_SUCCESS
    ]
  }),
  settings,
  error
});

export default rootReducer;
