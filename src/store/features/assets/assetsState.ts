import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Palette } from "shared/lib/entities/entitiesTypes";

type BackgroundAsset = {
  id: string;
  is360: boolean;
  isCGBOnly: boolean;
  tilesetId?: string;
  warnings: string[];
  numTiles: number;
  lookup: number[];
  timestamp: number;
  autoPalettes?: Palette[];
  hash: string;
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
        uiPaletteId: string;
      }>,
    ) => {
      state.backgroundsLoading = true;
    },
    setBackgroundAssetInfo: (
      state,
      action: PayloadAction<{
        id: string;
        is360: boolean;
        tilesetId?: string;
        isCGBOnly: boolean;
        warnings: string[];
        numTiles: number;
        lookup: number[];
        autoPalettes?: Palette[];
        hash: string;
      }>,
    ) => {
      state.backgroundsLoading = false;
      state.backgrounds[action.payload.id] = {
        id: action.payload.id,
        is360: action.payload.is360,
        tilesetId: action.payload.tilesetId,
        isCGBOnly: action.payload.isCGBOnly,
        warnings: action.payload.warnings,
        numTiles: action.payload.numTiles,
        lookup: action.payload.lookup,
        autoPalettes: action.payload.autoPalettes,
        timestamp: Date.now(),
        hash: action.payload.hash,
      };
    },
  },
});

export const { actions } = assetsSlice;

export default assetsSlice.reducer;
