import { combineReducers } from "redux";
import undoable from "redux-undo";
import tools from "./toolsReducer";
import project from "./projectReducer";
import editor from "./editorReducer";
import navigation from "./navigationReducer";
import document from "./documentReducer";
import console from "./consoleReducer";
import music from "./musicReducer";
import clipboard from "./clipboardReducer";
import entities from "./entitiesReducer";
import settings from "./settingsReducer";
import {
  PROJECT_LOAD_SUCCESS,
  PROJECT_SAVE_SUCCESS
} from "../actions/actionTypes";

let lastUndoStateTime = 0;
let lastEntityUndoStateTime = 0;

const UNDO_THROTTLE = 2000;

const rootReducer = combineReducers({
  tools,
  editor,
  project: undoable(project, {
    limit: 50,
    filter: (action, currentState, previousState) => {
      const shouldStoreUndo =
        currentState !== previousState &&
        Date.now() > lastUndoStateTime + UNDO_THROTTLE;
      if (shouldStoreUndo) {
        lastUndoStateTime = Date.now();
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
  document,
  navigation,
  console,
  music,
  clipboard,
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
  settings
});

export default rootReducer;
