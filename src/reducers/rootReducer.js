import { combineReducers } from "redux";
import undoable from "redux-undo";
import navigation from "./navigationReducer";
import console from "../store/features/console/consoleSlice";
import music from "../store/features/music/musicSlice";
import warnings from "../store/features/warnings/warningsSlice";
import entitiesNew from "../store/features/entities/entitiesSlice";
import document from "../store/features/document/documentSlice";
import editorNew from "../store/features/editor/editorSlice";
import settings from "../store/features/settings/settingsSlice";
import metadata from "../store/features/metadata/metadataSlice";
import error from "../store/features/error/errorSlice";

let lastEntityUndoStateTime = 0;
const UNDO_THROTTLE = 300;

const rootReducer = combineReducers({
  editor: editorNew,
  navigation,
  console,
  music,
  document,
  project: undoable(
    combineReducers({ entities: entitiesNew, settings, metadata }),
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
