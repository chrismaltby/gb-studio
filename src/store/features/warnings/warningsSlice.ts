import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CachedWarnings {
  id: string;
  warnings: string[];
  timestamp: number;
}

interface WarningsState {
  backgroundsLoading: boolean;
  backgrounds: Record<string, CachedWarnings>;
}

const initialState: WarningsState = {
  backgroundsLoading: false,
  backgrounds: {},
};

const warningsSlice = createSlice({
  name: "warnings",
  initialState,
  reducers: {
    checkBackgroundWarnings: (state, _action) => {
      state.backgroundsLoading = true;
    },
    setBackgroundWarnings: (
      state,
      action: PayloadAction<{ id: string; warnings: string[] }>
    ) => {
      state.backgroundsLoading = false;
      state.backgrounds[action.payload.id] = {
        id: action.payload.id,
        warnings: action.payload.warnings,
        timestamp: Date.now(),
      };
    },
  },
});

const { actions, reducer } = warningsSlice;

export const { checkBackgroundWarnings, setBackgroundWarnings } = actions;

export default reducer;
