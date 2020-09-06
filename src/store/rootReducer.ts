import { combineReducers } from "redux";
import undoable from "redux-undo";
import console from "./features/console/consoleSlice";
import music from "./features/music/musicSlice";
import warnings from "./features/warnings/warningsSlice";
import entitiesNew from "./features/entities/entitiesSlice";
import document from "./features/document/documentSlice";
import editorNew from "./features/editor/editorSlice";
import settings from "./features/settings/settingsSlice";
import metadata from "./features/metadata/metadataSlice";
import error from "./features/error/errorSlice";
import navigation from "./features/navigation/navigationSlice";

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
