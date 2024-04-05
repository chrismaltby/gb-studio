import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type BackgroundAsset = {
  id: string;
  is360: boolean;
  isCGBOnly: boolean;
  warnings: string[];
  numTiles: number;
  lookup: number[];
  timestamp: number;
};

export interface AssetsState {
  backgroundsLoading: boolean;
  backgrounds: Record<string, BackgroundAsset>;
}

export const initialState: AssetsState = {
  backgroundsLoading: false,
  backgrounds: {},
};

const assetsSlice = createSlice({
  name: "assets",
  initialState,
  reducers: {
    loadBackgroundAssetInfo: (
      state,
      _action: PayloadAction<{
        backgroundId: string;
        is360: boolean;
      }>
    ) => {
      state.backgroundsLoading = true;
    },
    setBackgroundAssetInfo: (
      state,
      action: PayloadAction<{
        id: string;
        is360: boolean;
        isCGBOnly: boolean;
        warnings: string[];
        numTiles: number;
        lookup: number[];
      }>
    ) => {
      state.backgroundsLoading = false;
      state.backgrounds[action.payload.id] = {
        id: action.payload.id,
        is360: action.payload.is360,
        isCGBOnly: action.payload.isCGBOnly,
        warnings: action.payload.warnings,
        numTiles: action.payload.numTiles,
        lookup: action.payload.lookup,
        timestamp: Date.now(),
      };
    },
  },
});

export const { actions, reducer } = assetsSlice;

export default reducer;
