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

let lastEntityUndoStateTime = 0;
const UNDO_THROTTLE = 300;

const rootReducer = combineReducers({
  tools,
  editor,
  document,
  navigation,
  console,
  music,
  entities: undoable(entities, {
    limit: 20,
    filter: (_action, currentState, previousHistory) => {
      const shouldStoreUndo =
        currentState !== previousHistory.present &&
        Date.now() > lastEntityUndoStateTime + UNDO_THROTTLE;
      if (shouldStoreUndo) {
        lastEntityUndoStateTime = Date.now();
      }
      return shouldStoreUndo;
    },
    initTypes: [
      "@@redux/INIT",
      "@@INIT"
    ]
  }),
  settings,
  error
});

export default rootReducer;
