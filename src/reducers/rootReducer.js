import { combineReducers } from "redux";
import undoable from "redux-undo";
import editor from "./editorReducer";
import navigation from "./navigationReducer";
import document from "./documentReducer";
import console from "../store/features/console/consoleSlice";
import music from "../store/features/music/musicSlice";
import entities from "./entitiesReducer";
import error from "./errorReducer";
import warnings from "../store/features/warnings/warningsSlice";
import entitiesNew from "../store/features/entities/entitiesSlice";
import documentNew from "../store/features/document/documentSlice";
import editorNew from "../store/features/editor/editorSlice";
import settings from "../store/features/settings/settingsSlice";
import metadata from "../store/features/metadata/metadataSlice";

let lastEntityUndoStateTime = 0;
const UNDO_THROTTLE = 300;

const rootReducer = combineReducers({
  editor: editorNew,
  editorOld: editor,
  document,
  navigation,
  console,
  music,
  project: undoable(
    combineReducers({ entities: entitiesNew, document: documentNew, settings, metadata }),
    {
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
      initTypes: ["@@redux/INIT", "@@INIT"],
    }
  ),
  error,
  warnings,
});

export default rootReducer;
