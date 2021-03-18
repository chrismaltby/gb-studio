import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CachedWarnings {
  id: string;
  is360: boolean;
  warnings: string[];
  numTiles: number;
  timestamp: number;
}

export interface WarningsState {
  backgroundsLoading: boolean;
  backgrounds: Record<string, CachedWarnings>;
}

export const initialState: WarningsState = {
  backgroundsLoading: false,
  backgrounds: {},
};

const warningsSlice = createSlice({
  name: "warnings",
  initialState,
  reducers: {
    checkBackgroundWarnings: (
      state,
      _action: PayloadAction<{
        backgroundId: string;
        is360: boolean;
      }>
    ) => {
      state.backgroundsLoading = true;
    },
    setBackgroundWarnings: (
      state,
      action: PayloadAction<{
        id: string;
        is360: boolean;
        warnings: string[];
        numTiles: number;
      }>
    ) => {
      state.backgroundsLoading = false;
      state.backgrounds[action.payload.id] = {
        id: action.payload.id,
        is360: action.payload.is360,
        warnings: action.payload.warnings,
        numTiles: action.payload.numTiles,
        timestamp: Date.now(),
      };
    },
  },
});

export const { actions, reducer } = warningsSlice;

export default reducer;
