import { ThunkMiddleware } from "redux-thunk";
import { RootState } from "store/configureStore";
import editorActions from "store/features/editor/editorActions";
import { musicSelectors } from "store/features/entities/entitiesState";
import navigationActions from "store/features/navigation/navigationActions";
import { saveSongFile } from "./trackerDocumentState";
import trackerDocumentActions from "./trackerDocumentActions";
import electronActions from "store/features/electron/electronActions";
import l10n from "renderer/lib/l10n";
import API from "renderer/lib/api";

const trackerMiddleware: ThunkMiddleware<RootState> =
  (store) => (next) => async (action) => {
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
        const option = await API.dialog.confirmUnsavedChangesTrackerDialog(
          selectedSong?.name ?? ""
        );
        switch (option) {
          case 0: // Save and continue
            store.dispatch(saveSongFile());
            store.dispatch({ type: "@@TRACKER_INIT" });
            break;
          case 1: // continue without saving
            store.dispatch(trackerDocumentActions.unloadSong());
            store.dispatch({ type: "@@TRACKER_INIT" });
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

    if (saveSongFile.rejected.match(action)) {
      store.dispatch(
        electronActions.showErrorBox({
          title: l10n("ERROR_UNABLE_TO_SAVE_MUSIC_FILE"),
          content: l10n("ERROR_UNABLE_TO_SAVE_MUSIC_FILE_DESC"),
        })
      );
    }

    return next(action);
  };

export default trackerMiddleware;
