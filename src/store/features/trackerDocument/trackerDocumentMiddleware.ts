import type { Middleware, UnknownAction } from "@reduxjs/toolkit";
import type { ThunkDispatch } from "redux-thunk";
import type { AppThunk, RootState } from "store/storeTypes";
import { musicSelectors } from "store/features/entities/entitiesSelectors";
import navigationActions from "store/features/navigation/navigationActions";
import {
  addNewSongFile,
  requestAddNewSongFile,
  saveSongFile,
} from "./trackerDocumentState";
import trackerDocumentActions from "./trackerDocumentActions";
import electronActions from "store/features/electron/electronActions";
import l10n from "shared/lib/lang/l10n";
import API from "renderer/lib/api";
import projectActions from "store/features/project/projectActions";
import trackerActions from "store/features/tracker/trackerActions";

const confirmUnsavedChangesAndContinue =
  (action: UnknownAction): AppThunk<Promise<UnknownAction | undefined>> =>
  async (dispatch, getState) => {
    const state = getState();
    const songsLookup = musicSelectors.selectEntities(state);
    const selectedSong = songsLookup[state.tracker.selectedSongId];
    const option = await API.dialog.confirmUnsavedChangesTrackerDialog(
      selectedSong?.name ?? "",
    );

    if (option === 0) {
      // Save and continue
      const result = await dispatch(saveSongFile());
      if (saveSongFile.rejected.match(result)) {
        return;
      }
    } else if (option === 1) {
      // Continue without saving
      dispatch(trackerDocumentActions.unloadSong());
    } else {
      // Cancel
      return;
    }

    return dispatch(action);
  };

type TrackerDispatch = ThunkDispatch<RootState, undefined, UnknownAction>;

const trackerMiddleware: Middleware<object, RootState, TrackerDispatch> =
  (store) => (next) => (action) => {
    const state = store.getState();

    if (
      (navigationActions.setSection.match(action) &&
        action.payload !== "music") ||
      (trackerActions.setSelectedSongId.match(action) &&
        action.payload !== state.tracker.selectedSongId) ||
      requestAddNewSongFile.match(action)
    ) {
      if (state.tracker.modified) {
        return store.dispatch(
          confirmUnsavedChangesAndContinue(action as UnknownAction),
        );
      }
    }

    // Delay creation until confirmUnsavedChangesTrackerDialog has
    // had a chance to ask about unsaved changes
    if (requestAddNewSongFile.match(action)) {
      store.dispatch(addNewSongFile(action.payload));
    }

    if (
      projectActions.saveProject.pending.match(action) &&
      state.tracker.modified
    ) {
      store.dispatch(saveSongFile());
    }

    if (saveSongFile.rejected.match(action)) {
      store.dispatch(
        electronActions.showErrorBox({
          title: l10n("ERROR_UNABLE_TO_SAVE_MUSIC_FILE"),
          content: l10n("ERROR_UNABLE_TO_SAVE_MUSIC_FILE_DESC"),
        }),
      );
    }

    return next(action);
  };

export default trackerMiddleware;
