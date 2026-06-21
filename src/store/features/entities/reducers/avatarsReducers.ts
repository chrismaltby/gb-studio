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
} from "shared/lib/entities/entitiesHelpers";
import { AvatarResourceAsset } from "shared/lib/resources/types";
import { avatarsAdapter } from "store/features/entities/adapters";

const loadAvatar: CaseReducer<
  EntitiesState,
  PayloadAction<{
    data: AvatarResourceAsset;
  }>
> = (state, action) => {
  upsertAssetEntity(state.avatars, avatarsAdapter, action.payload.data, ["id"]);
  ensureSymbolsUnique(state);
};

const removeAvatar: CaseReducer<
  EntitiesState,
  PayloadAction<{
    filename: string;
    plugin?: string;
  }>
> = (state, action) => {
  removeAssetEntity(state.avatars, avatarsAdapter, action.payload);
};

const avatarsReducers = {
  loadAvatar,
  removeAvatar,
} satisfies SliceCaseReducers<EntitiesState>;

export default avatarsReducers;
