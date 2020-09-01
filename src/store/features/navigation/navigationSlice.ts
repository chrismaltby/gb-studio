import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { addPalette } from "../entities/entitiesSlice";
import { stdErr } from "../console/consoleSlice";

type NavigationSection =
  | "world"
  | "sprites"
  | "backgrounds"
  | "ui"
  | "music"
  | "palettes"
  | "dialogue"
  | "build"
  | "settings";

interface NavigationState {
  section: NavigationSection;
  id: string;
}

const initialState: NavigationState = {
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
      .addCase(addPalette, (state, action) => {
        state.id = action.payload.paletteId;
      })
      // Switch to build screen on any errors
      .addCase(stdErr, (state, action) => {
        state.section = "build";
      }),
});

export const { reducer, actions } = navigationSlice;

export default reducer;
