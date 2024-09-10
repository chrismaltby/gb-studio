import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type BackgroundAsset = {
  id: string;
  is360: boolean;
  allocationStrat: number;
  isCGBOnly: boolean;
  tilesetId?: string;
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
        tilesetId?: string;
        is360: boolean;
		allocationStrat: number;
      }>
    ) => {
      state.backgroundsLoading = true;
    },
    setBackgroundAssetInfo: (
      state,
      action: PayloadAction<{
        id: string;
        is360: boolean;
		allocationStrat: number;
        tilesetId?: string;
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
		allocationStrat: action.payload.allocationStrat,
        tilesetId: action.payload.tilesetId,
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
