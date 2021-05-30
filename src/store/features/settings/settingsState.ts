import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../configureStore";
import { ActorDirection } from "../entities/entitiesTypes";
import projectActions from "../project/projectActions";

type ShowConnectionsSetting = "all" | "selected" | true | false;

export type SettingsState = {
  startSceneId: string;
  playerSpriteSheetId: string;
  startX: number;
  startY: number;
  startMoveSpeed: number;
  startAnimSpeed: number | null;
  startDirection: ActorDirection;
  showCollisions: boolean;
  showConnections: ShowConnectionsSetting;
  worldScrollX: number;
  worldScrollY: number;
  zoom: number;
  customColorsEnabled: boolean;
  customHead: string;
  defaultBackgroundPaletteIds: [string, string, string, string, string, string];
  defaultSpritePaletteId: string;
  defaultUIPaletteId: string;
  playerPaletteId: string;
  navigatorSplitSizes: number[];
  showNavigator: boolean;
};

export const initialState: SettingsState = {
  startSceneId: "",
  playerSpriteSheetId: "",
  startX: 0,
  startY: 0,
  startMoveSpeed: 1,
  startAnimSpeed: 3,
  startDirection: "down",
  showCollisions: true,
  showConnections: "selected",
  worldScrollX: 0,
  worldScrollY: 0,
  zoom: 100,
  customColorsEnabled: false,
  customHead: "",
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
  playerPaletteId: "",
  navigatorSplitSizes: [300, 100, 100],
  showNavigator: true,
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

    setShowNavigator: (state, action: PayloadAction<boolean>) => {
      state.showNavigator = action.payload;
    },
  },
  extraReducers: (builder) =>
    builder.addCase(projectActions.loadProject.fulfilled, (state, action) => {
      return {
        ...state,
        ...action.payload.data.settings,
      };
    }),
});

export const getSettings = (state: RootState) => state.project.present.settings;

export const { actions, reducer } = settingsSlice;

export default reducer;
