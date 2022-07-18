import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import entitiesActions from "../entities/entitiesActions";
import consoleActions from "../console/consoleActions";

export type NavigationSection =
  | "world"
  | "sprites"
  | "backgrounds"
  | "music"
  | "sounds"
  | "palettes"
  | "dialogue"
  | "build"
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
      // Switch to build screen on any errors
      .addCase(consoleActions.stdErr, (state, _action) => {
        state.section = "build";
      }),
});

export const { reducer, actions } = navigationSlice;

export default reducer;
