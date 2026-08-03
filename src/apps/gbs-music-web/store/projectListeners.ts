import type { ListenerMiddlewareInstance } from "@reduxjs/toolkit";
import { renameWebDocument } from "gbs-music-web/lib/adapters";
import { musicAssetActions } from "gbs-music-web/store/features/musicAssets/musicAssetsState";
import type { MusicEditorRootState } from "gbs-music-web/store/configureStore";
import { actions as trackerDocumentActions } from "store/features/trackerDocument/trackerDocumentState";
import projectActions from "store/features/project/projectActions";

type StartMusicAppListening =
  ListenerMiddlewareInstance<MusicEditorRootState>["startListening"];

export const registerProjectListeners = (
  startListening: StartMusicAppListening,
) => {
  startListening({
    actionCreator: projectActions.renameMusicAsset,
    effect: async (action, listenerApi) => {
      const state = listenerApi.getState();
      const asset =
        state.project.present.entities.music.entities[action.payload.musicId];
      if (!asset) {
        return;
      }

      const safeName = action.payload.newFilename.replace(/[/\\]/g, "").trim();
      if (!safeName) {
        return;
      }

      const newFilename = `${safeName}.${asset.type === "uge" ? "uge" : "mod"}`;
      if (newFilename === asset.filename) {
        return;
      }

      await renameWebDocument(
        action.payload.musicId,
        asset.filename,
        newFilename,
      );

      listenerApi.dispatch(
        musicAssetActions.renameMusicAsset({
          musicId: action.payload.musicId,
          newFilename,
        }),
      );

      if (action.payload.musicId === state.tracker.selectedSongId) {
        listenerApi.dispatch(
          trackerDocumentActions.setSongFilename(newFilename),
        );
      }
    },
  });
};
