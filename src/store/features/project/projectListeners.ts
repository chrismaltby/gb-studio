import type {
  ThunkDispatch,
  TypedStartListening,
  UnknownAction,
} from "@reduxjs/toolkit";
import { musicSelectors } from "store/features/entities/entitiesSelectors";
import projectActions from "store/features/project/projectActions";
import { saveSongFile } from "store/features/trackerDocument/trackerDocumentState";
import type { RootState } from "store/storeTypes";

type AppDispatch = ThunkDispatch<RootState, unknown, UnknownAction>;
type StartAppListening = TypedStartListening<RootState, AppDispatch>;

export const registerProjectListeners = (startListening: StartAppListening) => {
  startListening({
    actionCreator: projectActions.renameMusicAsset,
    effect: async (action, listenerApi) => {
      const state = listenerApi.getState();
      const asset = musicSelectors.selectById(state, action.payload.musicId);
      if (!asset) {
        return;
      }

      if (state.trackerDocument.present.song && state.tracker.modified) {
        const result = await listenerApi.dispatch(saveSongFile());
        if (saveSongFile.rejected.match(result)) {
          return;
        }
      }

      await listenerApi.dispatch(
        projectActions.renameAsset({
          assetType: "music",
          asset,
          newFilename: `${action.payload.newFilename}.${
            asset.type === "uge" ? "uge" : "mod"
          }`,
        }),
      );
    },
  });
};
