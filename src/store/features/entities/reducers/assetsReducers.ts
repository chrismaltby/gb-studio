import {
  PayloadAction,
  CaseReducer,
  SliceCaseReducers,
} from "@reduxjs/toolkit";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import {
  removeAssetEntity,
  renameAssetEntity,
} from "shared/lib/entities/entitiesHelpers";
import { Asset, AssetType } from "shared/lib/helpers/assets";
import { assertUnreachable } from "shared/lib/scriptValue/format";
import {
  backgroundsAdapter,
  spriteSheetsAdapter,
  musicAdapter,
  soundsAdapter,
  fontsAdapter,
  avatarsAdapter,
  emotesAdapter,
  tilesetsAdapter,
} from "store/features/entities/adapters";
import {
  localSpriteSheetSelectAll,
  localBackgroundSelectAll,
  localMusicSelectAll,
} from "store/features/entities/helpers";
import { updateMonoOverrideIds } from "store/features/entities/reducers/backgroundsReducers";

export const removedAsset: CaseReducer<
  EntitiesState,
  PayloadAction<{
    assetType: AssetType;
    asset: Asset;
  }>
> = (state, action) => {
  const { assetType, asset } = action.payload;
  if (assetType === "backgrounds") {
    removeAssetEntity(state.backgrounds, backgroundsAdapter, asset);
    updateMonoOverrideIds(state);
  } else if (assetType === "tilesets") {
    removeAssetEntity(state.tilesets, tilesetsAdapter, asset);
  } else if (assetType === "music") {
    removeAssetEntity(state.music, musicAdapter, asset);
  } else if (assetType === "sounds") {
    removeAssetEntity(state.sounds, soundsAdapter, asset);
  } else if (assetType === "fonts") {
    removeAssetEntity(state.fonts, fontsAdapter, asset);
  } else if (assetType === "avatars") {
    removeAssetEntity(state.avatars, avatarsAdapter, asset);
  } else if (assetType === "emotes") {
    removeAssetEntity(state.emotes, emotesAdapter, asset);
  } else if (assetType === "sprites") {
    removeAssetEntity(state.spriteSheets, spriteSheetsAdapter, asset);
  } else if (assetType === "ui") {
    // Ignore UI
  } else {
    assertUnreachable(assetType);
  }
};

export const renamedAsset: CaseReducer<
  EntitiesState,
  PayloadAction<{
    assetType: AssetType;
    asset: Asset;
    newFilename: string;
  }>
> = (state, action) => {
  const { assetType, asset, newFilename } = action.payload;
  if (assetType === "backgrounds") {
    renameAssetEntity(
      state.backgrounds,
      backgroundsAdapter,
      asset,
      newFilename,
    );
    updateMonoOverrideIds(state);
  } else if (assetType === "tilesets") {
    renameAssetEntity(state.tilesets, tilesetsAdapter, asset, newFilename);
  } else if (assetType === "music") {
    renameAssetEntity(state.music, musicAdapter, asset, newFilename);
  } else if (assetType === "sounds") {
    renameAssetEntity(state.sounds, soundsAdapter, asset, newFilename);
  } else if (assetType === "fonts") {
    renameAssetEntity(state.fonts, fontsAdapter, asset, newFilename);
  } else if (assetType === "avatars") {
    renameAssetEntity(state.avatars, avatarsAdapter, asset, newFilename);
  } else if (assetType === "emotes") {
    renameAssetEntity(state.emotes, emotesAdapter, asset, newFilename);
  } else if (assetType === "sprites") {
    renameAssetEntity(
      state.spriteSheets,
      spriteSheetsAdapter,
      asset,
      newFilename,
    );
  } else if (assetType === "ui") {
    // Ignore UI
  } else {
    assertUnreachable(assetType);
  }
};

export const reloadAssets: CaseReducer<EntitiesState> = (state) => {
  const now = Date.now();

  const updateTimestamp = <T extends { _v: number }>(obj: T): T => {
    obj._v = now;
    return obj;
  };

  const backgrounds = localBackgroundSelectAll(state).map(updateTimestamp);
  const spriteSheets = localSpriteSheetSelectAll(state).map(updateTimestamp);
  const music = localMusicSelectAll(state).map(updateTimestamp);

  backgroundsAdapter.setAll(state.backgrounds, backgrounds);
  spriteSheetsAdapter.setAll(state.spriteSheets, spriteSheets);
  musicAdapter.setAll(state.music, music);
};

const assetsReducers = {
  removedAsset,
  renamedAsset,
} satisfies SliceCaseReducers<EntitiesState>;

export default assetsReducers;
