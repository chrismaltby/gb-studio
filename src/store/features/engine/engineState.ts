import { createSlice, Dictionary, PayloadAction } from "@reduxjs/toolkit";
import keyBy from "lodash/keyBy";

export type EngineFieldType = "number" | "slider" | "checkbox" | "select";

export type EngineFieldCType = "UBYTE" | "UWORD" | "BYTE" | "WORD" | "define";

export type EngineFieldSchema = {
  key: string;
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

export interface EngineState {
  fields: EngineFieldSchema[];
  lookup: Dictionary<EngineFieldSchema>;
}

export const initialState: EngineState = {
  fields: [],
  lookup: {},
};

const engineSlice = createSlice({
  name: "engine",
  initialState,
  reducers: {
    setEngineFields: (state, action: PayloadAction<EngineFieldSchema[]>) => {
      state.fields = action.payload;
      state.lookup = keyBy(action.payload, "key");
    },
  },
});

export const { actions, reducer } = engineSlice;

export default reducer;
