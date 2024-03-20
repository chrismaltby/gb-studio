import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ScriptMapData, VariableMapData } from "lib/compiler/compileData";
import type { DebuggerScriptContext } from "shared/lib/debugger/types";

export interface DebuggerState {
  initialized: boolean;
  memoryMap: Record<string, number>;
  variableSymbols: string[];
  variableIndexBySymbol: Record<string, number>;
  variableDataBySymbol: Record<string, VariableMapData>;
  memoryDict: Map<number, Map<number, string>>;
  gbvmScripts: Record<string, string>;
  scriptMap: Record<string, ScriptMapData>;
  vramPreview: string;
  variablesData: number[];
  scriptContexts: DebuggerScriptContext[];
  currentScriptSymbol: string;
}

export const initialState: DebuggerState = {
  initialized: false,
  memoryMap: {},
  variableSymbols: [],
  variableIndexBySymbol: {},
  variableDataBySymbol: {},
  memoryDict: new Map(),
  gbvmScripts: {},
  scriptMap: {},
  vramPreview: "",
  variablesData: [],
  scriptContexts: [],
  currentScriptSymbol: "",
};

const debuggerSlice = createSlice({
  name: "debug",
  initialState,
  reducers: {
    setSymbols: (
      state,
      action: PayloadAction<{
        memoryMap: Record<string, number>;
        globalVariables: Record<string, number>;
        memoryDict: Map<number, Map<number, string>>;
        variableDataBySymbol: Record<string, VariableMapData>;
        scriptMap: Record<string, ScriptMapData>;
        gbvmScripts: Record<string, string>;
      }>
    ) => {
      state.memoryMap = action.payload.memoryMap;
      state.variableIndexBySymbol = action.payload.globalVariables;
      state.variableDataBySymbol = action.payload.variableDataBySymbol;
      state.memoryDict = action.payload.memoryDict;
      state.scriptMap = action.payload.scriptMap;
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
      }>
    ) => {
      state.vramPreview = action.payload.vramPreview;
      state.variablesData = action.payload.variablesData;
      state.scriptContexts = action.payload.scriptContexts;
    },
    setCurrentScriptSymbol: (state, action: PayloadAction<string>) => {
      state.currentScriptSymbol = action.payload;
    },
  },
});

export const { actions, reducer } = debuggerSlice;

export default reducer;
