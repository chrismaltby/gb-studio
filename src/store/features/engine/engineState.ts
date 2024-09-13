import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import keyBy from "lodash/keyBy";
import projectActions from "store/features/project/projectActions";

export type EngineFieldType = "number" | "slider" | "checkbox" | "select";

export type EngineFieldCType = "UBYTE" | "UWORD" | "BYTE" | "WORD" | "define";

export type EngineFieldSchema = {
  key: string;
  sceneType?: string;
  label: string;
  group: string;
  type: EngineFieldType;
  cType: EngineFieldCType;
  defaultValue: number | string | boolean | undefined;
  min?: number;
  max?: number;
  options?: [number, string][];
  file?: string;
};

export type SceneTypeSchema = {
  key: string;
  label: string;
  files?: string[];
};

export interface EngineState {
  loaded: boolean;
  fields: EngineFieldSchema[];
  lookup: Record<string, EngineFieldSchema>;
  sceneTypes: SceneTypeSchema[];
}

export const initialState: EngineState = {
  loaded: false,
  fields: [],
  lookup: {},
  sceneTypes: [],
};

const engineSlice = createSlice({
  name: "engine",
  initialState,
  reducers: {
    setEngineFields: (state, action: PayloadAction<EngineFieldSchema[]>) => {
      state.fields = action.payload;
      state.lookup = keyBy(action.payload, "key");
    },
    setScenetypes: (state, action: PayloadAction<SceneTypeSchema[]>) => {
      state.sceneTypes = action.payload;
    },
  },
  extraReducers: (builder) =>
    builder
      .addCase(projectActions.loadProject.pending, (state, _action) => {
        state.loaded = false;
      })
      .addCase(projectActions.loadProject.fulfilled, (state, action) => {
        state.fields = action.payload.engineFields;
        state.lookup = keyBy(action.payload.engineFields, "key");
        state.sceneTypes = action.payload.sceneTypes;
        state.loaded = true;
      }),
});

export const { actions, reducer } = engineSlice;

export default reducer;
