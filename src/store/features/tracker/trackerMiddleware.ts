import { ThunkMiddleware } from "redux-thunk";
import confirmUnsavedChangesTrackerDialog from "../../../lib/electron/dialog/confirmUnsavedChangesTrackerDialog";
import { assetFilename } from "../../../lib/helpers/gbstudio";
import { RootState } from "../../configureStore";
import editorActions from "../editor/editorActions";
import { musicSelectors } from "../entities/entitiesState";
import navigationActions from "../navigation/navigationActions";
import { saveSongFile } from "./trackerState";

const trackerMiddleware: ThunkMiddleware<RootState> = (store) => (next) => (
  action
) => {
  const state = store.getState();

  if (
    (navigationActions.setSection.match(action) && action.payload !== "music") ||
    (editorActions.setSelectedSongId.match(action) && action.payload !== state.editor.selectedSongId)) {
    if (state.tracker.present.modified) {
      // Display confirmation and stop action if 
      const songsLookup = musicSelectors.selectEntities(state);
      const selectedSong = songsLookup[state.editor.selectedSongId];
      const option = confirmUnsavedChangesTrackerDialog(selectedSong?.name);
      switch (option) {
        case 0: // Save and continue
          const path = `${assetFilename(
            state.document.root,
            "music",
            selectedSong
          )}`;
          store.dispatch(saveSongFile(path));
          break;
        case 1: // continue without saving 
          break;
        case 2: // cancel
        default:
          return
      }
    }
  }
  return next(action);
};

export default trackerMiddleware;