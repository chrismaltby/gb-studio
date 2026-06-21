import {
  PayloadAction,
  CaseReducer,
  SliceCaseReducers,
} from "@reduxjs/toolkit";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import {
  ensureSymbolsUnique,
  upsertAssetEntity,
  updateEntitySymbol,
} from "shared/lib/entities/entitiesHelpers";
import { MusicAsset, MusicSettings } from "shared/lib/resources/types";
import { musicAdapter } from "store/features/entities/adapters";
import { localMusicSelectById } from "store/features/entities/helpers";

export const loadMusic: CaseReducer<
  EntitiesState,
  PayloadAction<{
    data: MusicAsset;
  }>
> = (state, action) => {
  upsertAssetEntity(state.music, musicAdapter, action.payload.data, [
    "id",
    "symbol",
    "settings",
  ]);
  ensureSymbolsUnique(state);
};

const editMusicSettings: CaseReducer<
  EntitiesState,
  PayloadAction<{ musicId: string; changes: Partial<MusicSettings> }>
> = (state, action) => {
  const music = localMusicSelectById(state, action.payload.musicId);
  if (music) {
    musicAdapter.updateOne(state.music, {
      id: music.id,
      changes: {
        settings: {
          ...music.settings,
          ...action.payload.changes,
        },
      },
    });
  }
};

const setMusicSymbol: CaseReducer<
  EntitiesState,
  PayloadAction<{ musicId: string; symbol: string }>
> = (state, action) => {
  updateEntitySymbol(
    state,
    state.music,
    musicAdapter,
    action.payload.musicId,
    action.payload.symbol,
  );
};

const musicReducers = {
  loadMusic,
  editMusicSettings,
  setMusicSymbol,
} satisfies SliceCaseReducers<EntitiesState>;

export default musicReducers;
