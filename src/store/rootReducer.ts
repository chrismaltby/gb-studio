import { combineReducers } from "redux";
import undoable from "redux-undo";
import console from "./features/console/consoleState";
import music from "./features/music/musicState";
import warnings from "./features/warnings/warningsState";
import entities from "./features/entities/entitiesState";
import document from "./features/document/documentState";
import editor from "./features/editor/editorState";
import settings from "./features/settings/settingsState";
import metadata from "./features/metadata/metadataState";
import engine from "./features/engine/engineState";
import error from "./features/error/errorState";
import navigation from "./features/navigation/navigationState";

let lastEntityUndoStateTime = 0;
const UNDO_THROTTLE = 300;

const rootReducer = combineReducers({
  editor,
  console,
  music,
  navigation,
  document,
  engine,
  project: undoable(
    combineReducers({ entities, settings, metadata }),
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
