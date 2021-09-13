import { ThunkMiddleware } from "redux-thunk";
import confirmUnsavedChangesTrackerDialog from "lib/electron/dialog/confirmUnsavedChangesTrackerDialog";
import { assetFilename } from "lib/helpers/gbstudio";
import { RootState } from "store/configureStore";
import editorActions from "../editor/editorActions";
import { musicSelectors } from "../entities/entitiesState";
import navigationActions from "../navigation/navigationActions";
import { saveSongFile } from "./trackerDocumentState";
import trackerDocumentActions from "./trackerDocumentActions";

const trackerMiddleware: ThunkMiddleware<RootState> =
  (store) => (next) => (action) => {
    const state = store.getState();

    if (
      (navigationActions.setSection.match(action) &&
        action.payload !== "music") ||
      (editorActions.setSelectedSongId.match(action) &&
        action.payload !== state.editor.selectedSongId)
    ) {
      if (state.trackerDocument.present.modified) {
        // Display confirmation and stop action if
        const songsLookup = musicSelectors.selectEntities(state);
        const selectedSong = songsLookup[state.editor.selectedSongId];
        const option = confirmUnsavedChangesTrackerDialog(selectedSong?.name);
        switch (option) {
          case 0: // Save and continue
            store.dispatch(saveSongFile());
            break;
          case 1: // continue without saving
            store.dispatch(trackerDocumentActions.unloadSong());
            break;
          case 2: // cancel
          default:
            return;
        }
      }
    }

    if (
      action.type === "project/saveProject/pending" &&
      state.trackerDocument.present.modified
    ) {
      store.dispatch(saveSongFile());
    }

    return next(action);
  };

export default trackerMiddleware;
