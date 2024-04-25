import { Dispatch, Middleware } from "@reduxjs/toolkit";
import { RootState } from "store/configureStore";
import entitiesActions from "./entitiesActions";
import { selectScriptEventDefs } from "store/features/scriptEventDefs/scriptEventDefsState";
import {
  backgroundSelectors,
  musicSelectors,
  spriteSheetSelectors,
  tilesetSelectors,
} from "store/features/entities/entitiesState";
import API from "renderer/lib/api";
import { Asset, AssetType } from "shared/lib/helpers/assets";

const entitiesMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => async (action) => {
    if (
      entitiesActions.editScriptEvent.match(action) ||
      entitiesActions.editScriptEventArg.match(action) ||
      entitiesActions.removeScriptEvent.match(action) ||
      entitiesActions.addScriptEvents.match(action)
    ) {
      const state = store.getState();
      const editorType = state.editor.type;
      const entityId = state.editor.entityId;
      const scriptEventDefs = selectScriptEventDefs(state);

      if (editorType === "customEvent") {
        store.dispatch(
          entitiesActions.refreshCustomEventArgs({
            customEventId: entityId,
            scriptEventDefs,
          })
        );
      }
    }

    const renameAsset = async (
      assetType: AssetType,
      asset: Asset,
      newName: string,
      fileExtension: string
    ) => {
      const newFilename = `${newName}.${fileExtension}`;
      const renameSuccess = await API.project.renameAsset(
        assetType,
        asset,
        newFilename
      );
      if (!renameSuccess) {
        return;
      }
      store.dispatch(
        entitiesActions.renameAsset({
          assetType: assetType,
          filename: asset.filename,
          newFilename,
          plugin: asset.plugin,
        })
      );
    };

    if (entitiesActions.renameBackground.match(action)) {
      const state = store.getState();
      const background = backgroundSelectors.selectById(
        state,
        action.payload.backgroundId
      );
      if (background) {
        renameAsset("backgrounds", background, action.payload.name, "png");
      }
    } else if (entitiesActions.renameTileset.match(action)) {
      const state = store.getState();
      const tileset = tilesetSelectors.selectById(
        state,
        action.payload.tilesetId
      );
      if (tileset) {
        renameAsset("tilesets", tileset, action.payload.name, "png");
      }
    } else if (entitiesActions.renameSpriteSheet.match(action)) {
      const state = store.getState();
      const spriteSheet = spriteSheetSelectors.selectById(
        state,
        action.payload.spriteSheetId
      );
      if (spriteSheet) {
        renameAsset("sprites", spriteSheet, action.payload.name, "png");
      }
    } else if (entitiesActions.renameMusic.match(action)) {
      const state = store.getState();
      const music = musicSelectors.selectById(state, action.payload.musicId);
      if (music) {
        renameAsset("music", music, action.payload.name, "uge");
      }
    }
    next(action);
  };

export default entitiesMiddleware;
