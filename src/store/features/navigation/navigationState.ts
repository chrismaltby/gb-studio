import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import entitiesActions from "store/features/entities/entitiesActions";

export type NavigationSection =
  | "world"
  | "sprites"
  | "backgrounds"
  | "music"
  | "sounds"
  | "palettes"
  | "dialogue"
  | "settings";

export interface NavigationState {
  section: NavigationSection;
  id: string;
}

export const initialState: NavigationState = {
  section: "world",
  id: "",
};

const navigationSlice = createSlice({
  name: "navigation",
  initialState,
  reducers: {
    setSection: (state, action: PayloadAction<NavigationSection>) => {
      state.section = action.payload;
    },
    setNavigationId: (state, action: PayloadAction<string>) => {
      state.id = action.payload;
    },
  },
  extraReducers: (builder) =>
    builder
      // Select newly created palette in sidebar
      .addCase(entitiesActions.addPalette, (state, action) => {
        state.id = action.payload.paletteId;
      })
      // Select newly duplicated palette in sidebar
      .addCase(entitiesActions.duplicatePalette, (state, action) => {
        state.id = action.payload.newPaletteId;
      }),
});

export const { actions } = navigationSlice;

export default navigationSlice.reducer;
