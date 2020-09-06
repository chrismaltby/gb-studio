import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../configureStore";
import projectActions from "../project/projectActions";

export type SettingsState = {
  startSceneId: string;
  startX: number;
  startY: number;
  showCollisions: boolean;
  showConnections: boolean;
  worldScrollX: number;
  worldScrollY: number;
  zoom: number;
  customColorsEnabled: boolean;
  defaultBackgroundPaletteIds: [string, string, string, string, string, string];
  defaultSpritePaletteId: string;
  defaultUIPaletteId: string;
}

const initialState: SettingsState = {
  startSceneId: "",
  startX: 0,
  startY: 0,
  showCollisions: true,
  showConnections: true,
  worldScrollX: 0,
  worldScrollY: 0,
  zoom: 100,
  customColorsEnabled: false,
  defaultBackgroundPaletteIds: [
    "default-bg-1",
    "default-bg-2",
    "default-bg-3",
    "default-bg-4",
    "default-bg-5",
    "default-bg-6",
  ],
  defaultSpritePaletteId: "default-sprite",
  defaultUIPaletteId: "default-ui",
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    editSettings: (state, action: PayloadAction<Partial<SettingsState>>) => {
      return {
        ...state,
        ...action.payload,
      };
    },

    editPlayerStartAt: (
      state,
      action: PayloadAction<{ sceneId: string; x: number; y: number }>
    ) => {
      state.startSceneId = action.payload.sceneId;
      state.startX = action.payload.x;
      state.startY = action.payload.y;
    },
  },
  extraReducers: (builder) =>
    builder.addCase(projectActions.loadProject.fulfilled, (state, action) => {
      return {
        ...state,
        ...action.payload.data.settings
      };
    }),  
});

export const getSettings = (state: RootState) => state.project.present.settings;

export const { actions, reducer } = settingsSlice;

export default reducer;
