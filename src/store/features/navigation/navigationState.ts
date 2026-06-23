import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import entitiesActions from "store/features/entities/entitiesActions";
import { addNewSongFile } from "store/features/trackerDocument/trackerDocumentState";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";

export type NavigationSection =
  | "world"
  | "sprites"
  | "images"
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
      })
      // When adding a new song file jump to it in navigator
      .addCase(addNewSongFile.fulfilled, (state, action) => {
        state.id = action.payload.data.id;
      })
      // When adding a importing song file jump to it in navigator
      .addCase(
        trackerDocumentActions.convertModToUgeSong.fulfilled,
        (state, action) => {
          state.id = action.payload.data.id;
        },
      ),
});

export const { actions } = navigationSlice;

export default navigationSlice.reducer;
