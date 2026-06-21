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
import { FontResourceAsset } from "shared/lib/resources/types";
import { fontsAdapter } from "store/features/entities/adapters";

const setFontSymbol: CaseReducer<
  EntitiesState,
  PayloadAction<{ fontId: string; symbol: string }>
> = (state, action) => {
  updateEntitySymbol(
    state,
    state.fonts,
    fontsAdapter,
    action.payload.fontId,
    action.payload.symbol,
  );
};

const loadFont: CaseReducer<
  EntitiesState,
  PayloadAction<{
    data: FontResourceAsset;
  }>
> = (state, action) => {
  upsertAssetEntity(state.fonts, fontsAdapter, action.payload.data, [
    "id",
    "symbol",
  ]);
  ensureSymbolsUnique(state);
};

const removeFont: CaseReducer<
  EntitiesState,
  PayloadAction<{
    filename: string;
    plugin?: string;
  }>
> = (state, action) => {
  removeAssetEntity(state.fonts, fontsAdapter, action.payload);
};

const fontsReducers = {
  loadFont,
  setFontSymbol,
  removeFont,
} satisfies SliceCaseReducers<EntitiesState>;

export default fontsReducers;
