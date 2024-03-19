import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ScriptMapData, VariableMapData } from "lib/compiler/compileData";
import { DebuggerScriptContext } from "shared/lib/debugger/types";

export interface ScriptMapItem {
  script: string[];
  entityId: string;
  entityType: string;
  scriptType: string;
}

export interface DebuggerState {
  memoryMap: Record<string, number>;
  variableSymbols: string[];
  variableIndexBySymbol: Record<string, number>;
  variableDataBySymbol: Record<string, VariableMapData>;
  memoryDict: Map<number, Map<number, string>>;
  scriptMap: { [key: string]: ScriptMapItem };
  vramPreview: string;
  variablesData: number[];
  scriptContexts: DebuggerScriptContext[];
}

export const initialState: DebuggerState = {
  memoryMap: {},
  variableSymbols: [],
  variableIndexBySymbol: {},
  variableDataBySymbol: {},
  memoryDict: new Map(),
  scriptMap: {},
  vramPreview: "",
  variablesData: [],
  scriptContexts: [],
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
      }>
    ) => {
      state.memoryMap = action.payload.memoryMap;
      state.variableIndexBySymbol = action.payload.globalVariables;
      state.variableDataBySymbol = action.payload.variableDataBySymbol;
      state.memoryDict = action.payload.memoryDict;
      state.scriptMap = action.payload.scriptMap;
      state.variableSymbols = Object.keys(state.variableDataBySymbol);
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
  },
});

export const { actions, reducer } = debuggerSlice;

export default reducer;
