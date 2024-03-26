import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { SceneMapData, VariableMapData } from "lib/compiler/compileData";
import isEqual from "lodash/isEqual";
import type { DebuggerScriptContext } from "shared/lib/debugger/types";

export interface DebuggerState {
  initialized: boolean;
  variableSymbols: string[];
  variableDataBySymbol: Record<string, VariableMapData>;
  gbvmScripts: Record<string, string>;
  sceneMap: Record<string, SceneMapData>;
  vramPreview: string;
  variablesData: number[];
  scriptContexts: DebuggerScriptContext[];
  currentSceneSymbol: string;
  isPaused: boolean;
}

export const initialState: DebuggerState = {
  initialized: false,
  variableSymbols: [],
  variableDataBySymbol: {},
  gbvmScripts: {},
  sceneMap: {},
  vramPreview: "",
  variablesData: [],
  scriptContexts: [],
  currentSceneSymbol: "",
  isPaused: true,
};

const debuggerSlice = createSlice({
  name: "debug",
  initialState,
  reducers: {
    disconnect: (state) => {
      state.initialized = false;
    },
    setSymbols: (
      state,
      action: PayloadAction<{
        variableDataBySymbol: Record<string, VariableMapData>;
        sceneMap: Record<string, SceneMapData>;
        gbvmScripts: Record<string, string>;
      }>
    ) => {
      state.variableDataBySymbol = action.payload.variableDataBySymbol;
      state.sceneMap = action.payload.sceneMap;
      state.gbvmScripts = action.payload.gbvmScripts;
      state.variableSymbols = Object.keys(state.variableDataBySymbol);
      state.initialized = true;
    },
    setRAMData: (
      state,
      action: PayloadAction<{
        vramPreview: string;
        variablesData: number[];
        scriptContexts: DebuggerScriptContext[];
        currentSceneSymbol: string;
        isPaused: boolean;
      }>
    ) => {
      state.isPaused = action.payload.isPaused;
      state.vramPreview = action.payload.vramPreview;
      if (!isEqual(state.variablesData, action.payload.variablesData)) {
        state.variablesData = action.payload.variablesData;
      }
      if (!isEqual(state.scriptContexts, action.payload.scriptContexts)) {
        state.scriptContexts = action.payload.scriptContexts;
      }
      state.currentSceneSymbol = action.payload.currentSceneSymbol;
    },
  },
});

export const { actions, reducer } = debuggerSlice;

export default reducer;
