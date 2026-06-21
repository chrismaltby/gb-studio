import {
  PayloadAction,
  CaseReducer,
  SliceCaseReducers,
} from "@reduxjs/toolkit";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import {
  ensureSymbolsUnique,
  removeAssetEntity,
  upsertAssetEntity,
  updateEntitySymbol,
} from "shared/lib/entities/entitiesHelpers";
import { EmoteResourceAsset } from "shared/lib/resources/types";
import { emotesAdapter } from "store/features/entities/adapters";

const setEmoteSymbol: CaseReducer<
  EntitiesState,
  PayloadAction<{ emoteId: string; symbol: string }>
> = (state, action) => {
  updateEntitySymbol(
    state,
    state.emotes,
    emotesAdapter,
    action.payload.emoteId,
    action.payload.symbol,
  );
};

const loadEmote: CaseReducer<
  EntitiesState,
  PayloadAction<{
    data: EmoteResourceAsset;
  }>
> = (state, action) => {
  upsertAssetEntity(state.emotes, emotesAdapter, action.payload.data, [
    "id",
    "symbol",
  ]);
  ensureSymbolsUnique(state);
};

const removeEmote: CaseReducer<
  EntitiesState,
  PayloadAction<{
    filename: string;
    plugin?: string;
  }>
> = (state, action) => {
  removeAssetEntity(state.emotes, emotesAdapter, action.payload);
};

const emotesReducers = {
  loadEmote,
  setEmoteSymbol,
  removeEmote,
} satisfies SliceCaseReducers<EntitiesState>;

export default emotesReducers;
