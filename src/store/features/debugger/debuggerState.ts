import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  SceneMapData,
  ScriptMapData,
  VariableMapData,
} from "lib/compiler/compileData";
import type { DebuggerScriptContext } from "shared/lib/debugger/types";

export interface DebuggerState {
  initialized: boolean;
  variableSymbols: string[];
  variableIndexBySymbol: Record<string, number>;
  variableDataBySymbol: Record<string, VariableMapData>;
  gbvmScripts: Record<string, string>;
  scriptMap: Record<string, ScriptMapData>;
  sceneMap: Record<string, SceneMapData>;
  vramPreview: string;
  variablesData: number[];
  scriptContexts: DebuggerScriptContext[];
  currentScriptSymbol: string;
  currentSceneSymbol: string;
  isPaused: boolean;
}

export const initialState: DebuggerState = {
  initialized: false,
  variableSymbols: [],
  variableIndexBySymbol: {},
  variableDataBySymbol: {},
  gbvmScripts: {},
  scriptMap: {},
  sceneMap: {},
  vramPreview: "",
  variablesData: [],
  scriptContexts: [],
  currentScriptSymbol: "",
  currentSceneSymbol: "",
  isPaused: true,
};

const debuggerSlice = createSlice({
  name: "debug",
  initialState,
  reducers: {
    setSymbols: (
      state,
      action: PayloadAction<{
        globalVariables: Record<string, number>;
        variableDataBySymbol: Record<string, VariableMapData>;
        scriptMap: Record<string, ScriptMapData>;
        sceneMap: Record<string, SceneMapData>;
        gbvmScripts: Record<string, string>;
      }>
    ) => {
      state.variableIndexBySymbol = action.payload.globalVariables;
      state.variableDataBySymbol = action.payload.variableDataBySymbol;
      state.scriptMap = action.payload.scriptMap;
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
        currentScriptSymbol: string;
        isPaused: boolean;
      }>
    ) => {
      state.isPaused = action.payload.isPaused;
      state.vramPreview = action.payload.vramPreview;
      state.variablesData = action.payload.variablesData;
      state.scriptContexts = action.payload.scriptContexts;
      state.currentSceneSymbol = action.payload.currentSceneSymbol;
      if (
        action.payload.currentScriptSymbol &&
        state.scriptMap[action.payload.currentScriptSymbol]
      ) {
        // Keep last seen symbols if empty
        state.currentScriptSymbol = action.payload.currentScriptSymbol;
      }
    },
  },
});

export const { actions, reducer } = debuggerSlice;

export default reducer;
