import { combineReducers } from "redux";
import undoable from "redux-undo";
import console from "../store/features/console/consoleSlice";
import music from "../store/features/music/musicSlice";
import warnings from "../store/features/warnings/warningsSlice";
import entitiesNew from "../store/features/entities/entitiesSlice";
import document from "../store/features/document/documentSlice";
import editorNew from "../store/features/editor/editorSlice";
import settings from "../store/features/settings/settingsSlice";
import metadata from "../store/features/metadata/metadataSlice";
import error from "../store/features/error/errorSlice";
import navigation from "../store/features/navigation/navigationSlice";

let lastEntityUndoStateTime = 0;
const UNDO_THROTTLE = 300;

const rootReducer = combineReducers({
  editor: editorNew,
  console,
  music,
  navigation,
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
