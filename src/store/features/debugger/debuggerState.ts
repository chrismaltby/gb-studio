import { createSlice, original, PayloadAction } from "@reduxjs/toolkit";
import type { SceneMapData, VariableMapData } from "lib/compiler/compileData";
import type { UsageData } from "lib/compiler/buildUsage";
import isEqual from "lodash/isEqual";
import type { DebuggerScriptContext } from "shared/lib/debugger/types";
import type { BuildUsageItemType } from "shared/lib/compiler/buildUsageItems";

export type DebuggerPane = "debugger" | "buildLog" | "romUsage";
export type DataUsageSortKey = "size" | "name" | "filename" | "type";
export type DataUsageFilter = "all" | BuildUsageItemType;

export interface DebuggerState {
  initialized: boolean;
  variableSymbols: string[];
  variableDataBySymbol: Record<string, VariableMapData>;
  gbvmScripts: Record<string, string>;
  sceneMap: Record<string, SceneMapData>;
  vramPreview: string;
  backgroundPreview: string;
  variablesData: number[];
  scriptContexts: DebuggerScriptContext[];
  currentSceneSymbol: string;
  isPaused: boolean;
  activePane: DebuggerPane;
  usageData: UsageData | null;
  dataUsageSearchTerm: string;
  dataUsageFilter: DataUsageFilter;
  dataUsageSortKey: DataUsageSortKey;
  dataUsageSortAsc: boolean;
}

export const initialState: DebuggerState = {
  initialized: false,
  variableSymbols: [],
  variableDataBySymbol: {},
  gbvmScripts: {},
  sceneMap: {},
  vramPreview: "",
  backgroundPreview: "",
  variablesData: [],
  scriptContexts: [],
  currentSceneSymbol: "",
  isPaused: true,
  activePane: "debugger",
  usageData: null,
  dataUsageSearchTerm: "",
  dataUsageFilter: "all",
  dataUsageSortKey: "size",
  dataUsageSortAsc: false,
};

const debuggerSlice = createSlice({
  name: "debug",
  initialState,
  reducers: {
    disconnect: (state) => {
      state.initialized = false;
      state.isPaused = false;
    },
    setSymbols: (
      state,
      action: PayloadAction<{
        variableDataBySymbol: Record<string, VariableMapData>;
        sceneMap: Record<string, SceneMapData>;
        gbvmScripts: Record<string, string>;
      }>,
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
        backgroundPreview: string;
        variablesData: number[];
        scriptContexts: DebuggerScriptContext[];
        currentSceneSymbol: string;
        isPaused: boolean;
      }>,
    ) => {
      if (!state.isPaused && action.payload.isPaused) {
        // Debugger became paused, close build log
        state.activePane = "debugger";
      }
      state.isPaused = action.payload.isPaused;
      state.vramPreview = action.payload.vramPreview;
      state.backgroundPreview = action.payload.backgroundPreview;
      if (!isEqual(state.variablesData, action.payload.variablesData)) {
        state.variablesData = action.payload.variablesData;
      }
      if (
        !isEqual(original(state.scriptContexts), action.payload.scriptContexts)
      ) {
        state.scriptContexts = action.payload.scriptContexts;
      }
      state.currentSceneSymbol = action.payload.currentSceneSymbol;
    },
    setActivePane: (state, action: PayloadAction<DebuggerPane>) => {
      state.activePane = action.payload;
    },
    setUsageData: (state, action: PayloadAction<UsageData>) => {
      state.usageData = action.payload;
    },
    setDataUsageSearchTerm: (state, action: PayloadAction<string>) => {
      state.dataUsageSearchTerm = action.payload;
    },
    setDataUsageFilter: (state, action: PayloadAction<DataUsageFilter>) => {
      state.dataUsageFilter = action.payload;
    },
    setDataUsageSortKey: (state, action: PayloadAction<DataUsageSortKey>) => {
      state.dataUsageSortKey = action.payload;
    },
    setDataUsageSortAsc: (state, action: PayloadAction<boolean>) => {
      state.dataUsageSortAsc = action.payload;
    },
  },
});

export const { actions } = debuggerSlice;

export default debuggerSlice.reducer;
