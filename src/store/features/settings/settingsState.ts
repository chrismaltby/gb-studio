import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "store/configureStore";
import { ActorDirection } from "../entities/entitiesTypes";
import projectActions from "../project/projectActions";

export type ShowConnectionsSetting = "all" | "selected" | true | false;
export type MusicDriverSetting = "huge" | "gbt";
export type CartType = "mbc5" | "mbc3";

export type SettingsState = {
  startSceneId: string;
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
  sgbEnabled: boolean;
  customHead: string;
  defaultBackgroundPaletteIds: [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string
  ];
  defaultSpritePaletteIds: [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string
  ];
  defaultSpritePaletteId: string;
  defaultUIPaletteId: string;
  playerPaletteId: string;
  navigatorSplitSizes: number[];
  showNavigator: boolean;
  defaultFontId: string;
  defaultCharacterEncoding: string;
  defaultPlayerSprites: Record<string, string>;
  musicDriver: MusicDriverSetting;
  cartType: CartType;
  batterylessEnabled: boolean;
  favoriteEvents: string[];
};

export const initialState: SettingsState = {
  startSceneId: "",
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
  sgbEnabled: false,
  customHead: "",
  defaultBackgroundPaletteIds: [
    "default-bg-1",
    "default-bg-2",
    "default-bg-3",
    "default-bg-4",
    "default-bg-5",
    "default-bg-6",
    "default-bg-7",
    "default-ui",
  ],
  defaultSpritePaletteIds: [
    "default-sprite-1",
    "default-sprite-2",
    "default-sprite-3",
    "default-sprite-4",
    "default-sprite-5",
    "default-sprite-6",
    "default-sprite-7",
    "default-sprite-8",
  ],
  defaultSpritePaletteId: "default-sprite",
  defaultUIPaletteId: "default-ui",
  playerPaletteId: "",
  navigatorSplitSizes: [300, 100, 100],
  showNavigator: true,
  defaultFontId: "",
  defaultCharacterEncoding: "",
  defaultPlayerSprites: {},
  musicDriver: "gbt",
  cartType: "mbc5",
  batterylessEnabled: false,
  favoriteEvents: ["EVENT_TEXT", "EVENT_SWITCH_SCENE"],
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

    setSceneTypeDefaultPlayerSprite: (
      state,
      action: PayloadAction<{
        sceneType: string;
        spriteSheetId: string;
      }>
    ) => {
      state.defaultPlayerSprites[action.payload.sceneType] =
        action.payload.spriteSheetId;
    },

    setShowNavigator: (state, action: PayloadAction<boolean>) => {
      state.showNavigator = action.payload;
    },

    toggleFavoriteEvent: (state, action: PayloadAction<string>) => {
      if (state.favoriteEvents.includes(action.payload)) {
        state.favoriteEvents = state.favoriteEvents.filter(
          (item) => item !== action.payload
        );
      } else {
        state.favoriteEvents.push(action.payload);
      }
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
