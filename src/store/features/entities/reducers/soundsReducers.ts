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
import { SoundResourceAsset } from "shared/lib/resources/types";
import { soundsAdapter } from "store/features/entities/adapters";

const loadSound: CaseReducer<
  EntitiesState,
  PayloadAction<{
    data: SoundResourceAsset;
  }>
> = (state, action) => {
  upsertAssetEntity(state.sounds, soundsAdapter, action.payload.data, [
    "id",
    "symbol",
  ]);
  ensureSymbolsUnique(state);
};

const setSoundSymbol: CaseReducer<
  EntitiesState,
  PayloadAction<{ soundId: string; symbol: string }>
> = (state, action) => {
  updateEntitySymbol(
    state,
    state.sounds,
    soundsAdapter,
    action.payload.soundId,
    action.payload.symbol,
  );
};

const soundsReducers = {
  loadSound,
  setSoundSymbol,
} satisfies SliceCaseReducers<EntitiesState>;

export default soundsReducers;
