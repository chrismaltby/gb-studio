import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { defaultProjectSettings } from "consts";
import { RootState } from "store/configureStore";
import projectActions from "store/features/project/projectActions";
import type { ScriptEditorCtx } from "shared/lib/scripts/context";
import { ScriptEventArgs } from "shared/lib/resources/types";
import uuid from "uuid";

export type ColorModeSetting = "mono" | "mixed" | "color";
export type ShowConnectionsSetting = "all" | "selected" | true | false;
export type MusicDriverSetting = "huge" | "gbt";
export type CartType = "mbc5" | "mbc3";
export type BreakpointData = {
  scriptEventId: string;
  context: ScriptEditorCtx;
};
export type SpriteModeSetting = "8x8" | "8x16";

export type SettingsState = typeof defaultProjectSettings;

export const initialState = defaultProjectSettings;

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
      action: PayloadAction<{ sceneId: string; x: number; y: number }>,
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
      }>,
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
          (item) => item !== action.payload,
        );
      } else {
        state.favoriteEvents.push(action.payload);
      }
    },

    toggleBreakpoint: (state, action: PayloadAction<BreakpointData>) => {
      const index = state.debuggerBreakpoints.findIndex(
        (item) => item.scriptEventId === action.payload.scriptEventId,
      );
      if (index !== -1) {
        state.debuggerBreakpoints.splice(index, 1);
      } else {
        state.debuggerBreakpoints.unshift(action.payload);
      }
    },

    toggleWatchedVariable: (state, action: PayloadAction<string>) => {
      if (state.debuggerWatchedVariables.includes(action.payload)) {
        state.debuggerWatchedVariables = state.debuggerWatchedVariables.filter(
          (item) => item !== action.payload,
        );
      } else {
        state.debuggerWatchedVariables.push(action.payload);
      }
    },

    toggleDebuggerPaneCollapsed: (state, action: PayloadAction<string>) => {
      if (state.debuggerCollapsedPanes.includes(action.payload)) {
        state.debuggerCollapsedPanes = state.debuggerCollapsedPanes.filter(
          (item) => item !== action.payload,
        );
      } else {
        state.debuggerCollapsedPanes.push(action.payload);
      }
    },

    addScriptEventPreset: {
      prepare: (payload: {
        id: string;
        name: string;
        groups: string[];
        args: ScriptEventArgs;
      }) => {
        return {
          payload: {
            ...payload,
            presetId: uuid(),
          },
        };
      },
      reducer: (
        state,
        action: PayloadAction<{
          id: string;
          presetId: string;
          name: string;
          groups: string[];
          args: ScriptEventArgs;
        }>,
      ) => {
        if (!state.scriptEventPresets[action.payload.id]) {
          state.scriptEventPresets[action.payload.id] = {};
        }
        state.scriptEventPresets[action.payload.id][action.payload.presetId] = {
          id: action.payload.presetId,
          name: action.payload.name,
          groups: action.payload.groups,
          args: action.payload.args,
        };
      },
    },

    editScriptEventPreset: (
      state,
      action: PayloadAction<{
        id: string;
        presetId: string;
        name: string;
        groups: string[];
        args: ScriptEventArgs;
      }>,
    ) => {
      if (
        !state.scriptEventPresets[action.payload.id] ||
        !state.scriptEventPresets[action.payload.id][action.payload.presetId]
      ) {
        return;
      }
      state.scriptEventPresets[action.payload.id][action.payload.presetId] = {
        id: action.payload.presetId,
        name: action.payload.name,
        groups: action.payload.groups,
        args: action.payload.args,
      };
    },

    removeScriptEventPreset: (
      state,
      action: PayloadAction<{
        id: string;
        presetId: string;
      }>,
    ) => {
      if (!state.scriptEventPresets[action.payload.id]) {
        return;
      }
      // If the preset to be deleted is currently set as the default, then unset default
      if (
        state.scriptEventDefaultPresets[action.payload.id] ===
        action.payload.presetId
      ) {
        delete state.scriptEventDefaultPresets[action.payload.id];
      }

      // Delete preset
      delete state.scriptEventPresets[action.payload.id][
        action.payload.presetId
      ];

      // If there are no more presets under this event type, remove the event type
      if (
        Object.keys(state.scriptEventPresets[action.payload.id]).length === 0
      ) {
        delete state.scriptEventPresets[action.payload.id];
      }
    },

    setScriptEventDefaultPreset: (
      state,
      action: PayloadAction<{ id: string; presetId: string }>,
    ) => {
      if (action.payload.presetId.length > 0) {
        state.scriptEventDefaultPresets[action.payload.id] =
          action.payload.presetId;
      } else {
        delete state.scriptEventDefaultPresets[action.payload.id];
      }
    },
  },
  extraReducers: (builder) =>
    builder.addCase(projectActions.loadProject.fulfilled, (state, action) => {
      return {
        ...state,
        ...action.payload.resources.settings,
      };
    }),
});

export const getSettings = (state: RootState) => state.project.present.settings;

export const { actions, reducer } = settingsSlice;

export default reducer;
