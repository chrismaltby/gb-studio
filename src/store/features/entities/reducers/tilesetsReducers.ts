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
import { TilesetResourceAsset } from "shared/lib/resources/types";
import { tilesetsAdapter } from "store/features/entities/adapters";

const setTilesetSymbol: CaseReducer<
  EntitiesState,
  PayloadAction<{ tilesetId: string; symbol: string }>
> = (state, action) => {
  updateEntitySymbol(
    state,
    state.tilesets,
    tilesetsAdapter,
    action.payload.tilesetId,
    action.payload.symbol,
  );
};

const loadTileset: CaseReducer<
  EntitiesState,
  PayloadAction<{
    data: TilesetResourceAsset;
  }>
> = (state, action) => {
  upsertAssetEntity(state.tilesets, tilesetsAdapter, action.payload.data, [
    "id",
    "symbol",
  ]);
  ensureSymbolsUnique(state);
};

const tilesetsReducers = {
  loadTileset,
  setTilesetSymbol,
} satisfies SliceCaseReducers<EntitiesState>;

export default tilesetsReducers;
