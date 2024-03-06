import { combineReducers } from "redux";
import undoable from "redux-undo";
import console from "./features/console/consoleState";
import music from "./features/music/musicState";
import assets from "./features/assets/assetsState";
import entities from "./features/entities/entitiesState";
import document from "./features/document/documentState";
import editor from "./features/editor/editorState";
import settings from "./features/settings/settingsState";
import metadata from "./features/metadata/metadataState";
import engine from "./features/engine/engineState";
import error from "./features/error/errorState";
import navigation from "./features/navigation/navigationState";
import clipboard from "./features/clipboard/clipboardState";
import sprite from "./features/sprite/spriteState";
import scriptEventDefs from "./features/scriptEventDefs/scriptEventDefsState";
import tracker from "./features/tracker/trackerState";
import trackerDocument from "./features/trackerDocument/trackerDocumentState";
import { TRACKER_REDO, TRACKER_UNDO } from "consts";

let lastEntityUndoStateTime = 0;
const UNDO_THROTTLE = 300;

const rootReducer = combineReducers({
  editor,
  console,
  music,
  navigation,
  document,
  engine,
  clipboard,
  sprite,
  scriptEventDefs,
  tracker,
  trackerDocument: undoable(trackerDocument, {
    limit: 20,
    initTypes: ["@@TRACKER_INIT"],
    filter: (action, _currentState, _previousHistory) => {
      return (
        action.type.startsWith("tracker/loadSong/fulfilled") ||
        action.type.startsWith("tracker/edit") ||
        action.type.startsWith("tracker/transpose") ||
        action.type.startsWith("tracker/addSequence") ||
        action.type.startsWith("tracker/removeSequence")
      );
    },
    ignoreInitialState: true,
    undoType: TRACKER_UNDO,
    redoType: TRACKER_REDO,
  }),
  project: undoable(combineReducers({ entities, settings, metadata }), {
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
  }),
  error,
  assets,
});

export default rootReducer;
