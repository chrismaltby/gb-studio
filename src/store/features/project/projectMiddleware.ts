import { Dispatch, EntitySelectors, Middleware } from "@reduxjs/toolkit";
import { RootState } from "store/configureStore";
import actions from "./projectActions";
import API from "renderer/lib/api";
import {
  backgroundSelectors,
  musicSelectors,
  soundSelectors,
  spriteSheetSelectors,
  tilesetSelectors,
} from "store/features/entities/entitiesState";
import { Asset, AssetType } from "shared/lib/helpers/assets";
import { assertUnreachable } from "shared/lib/helpers/assert";

const projectMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => async (action) => {
    if (actions.openProject.match(action)) {
      const shouldOpenProject = await API.dialog.migrateWarning(action.payload);

      if (!shouldOpenProject) {
        store.dispatch(actions.closeProject());
        return;
      }

      await API.app.showProjectWindow();

      actions.loadProject(action.payload)(store.dispatch, store.getState, {});
    } else if (actions.addFileToProject.match(action)) {
      const filename = action.payload;
      API.project.addFile(filename);
    }

    const renameAsset = async <T extends Asset>(
      assetType: AssetType,
      assetSelectors: EntitySelectors<T, RootState, string>,
      assetId: string,
      newName: string,
      getExtension: (asset: T) => string,
    ) => {
      const state = store.getState();
      const asset = assetSelectors.selectById(state, assetId);
      if (!asset) {
        return;
      }
      const newFilename = `${newName}.${getExtension(asset)}`;
      actions.renameAsset({
        assetType,
        asset,
        newFilename,
      })(store.dispatch, store.getState, {});
    };

    const removeAsset = async <T extends Asset>(
      assetType: AssetType,
      assetSelectors: EntitySelectors<T, RootState, string>,
      assetId: string,
    ) => {
      const state = store.getState();
      const asset = assetSelectors.selectById(state, assetId);
      if (asset) {
        actions.removeAsset({ assetType, asset })(
          store.dispatch,
          store.getState,
          {},
        );
      }
    };

    if (actions.renameBackgroundAsset.match(action)) {
      renameAsset(
        "backgrounds",
        backgroundSelectors,
        action.payload.backgroundId,
        action.payload.newFilename,
        () => "png",
      );
    } else if (actions.removeBackgroundAsset.match(action)) {
      removeAsset(
        "backgrounds",
        backgroundSelectors,
        action.payload.backgroundId,
      );
    } else if (actions.renameTilesetAsset.match(action)) {
      renameAsset(
        "tilesets",
        tilesetSelectors,
        action.payload.tilesetId,
        action.payload.newFilename,
        () => "png",
      );
    } else if (actions.removeTilesetAsset.match(action)) {
      removeAsset("tilesets", tilesetSelectors, action.payload.tilesetId);
    } else if (actions.renameSpriteAsset.match(action)) {
      renameAsset(
        "sprites",
        spriteSheetSelectors,
        action.payload.spriteSheetId,
        action.payload.newFilename,
        () => "png",
      );
    } else if (actions.removeSpriteAsset.match(action)) {
      removeAsset(
        "sprites",
        spriteSheetSelectors,
        action.payload.spriteSheetId,
      );
    } else if (actions.renameMusicAsset.match(action)) {
      renameAsset(
        "music",
        musicSelectors,
        action.payload.musicId,
        action.payload.newFilename,
        (asset) => (asset.type === "uge" ? "uge" : "mod"),
      );
    } else if (actions.removeMusicAsset.match(action)) {
      removeAsset("music", musicSelectors, action.payload.musicId);
    } else if (actions.renameSoundAsset.match(action)) {
      renameAsset(
        "sounds",
        soundSelectors,
        action.payload.soundId,
        action.payload.newFilename,
        (asset) =>
          asset.type === "fxhammer"
            ? "sav"
            : asset.type === "vgm"
              ? "vgm"
              : asset.type === "wav"
                ? "wav"
                : assertUnreachable(asset.type),
      );
    } else if (actions.removeSoundAsset.match(action)) {
      removeAsset("sounds", soundSelectors, action.payload.soundId);
    }

    // Run the reducers first so we can clear the project stack after loading
    next(action);
  };

export default projectMiddleware;
