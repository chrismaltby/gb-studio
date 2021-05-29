import { createSlice, PayloadAction } from "@reduxjs/toolkit";

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
};

export interface EngineState {
  fields: EngineFieldSchema[];
}

export const initialState: EngineState = {
  fields: [],
};

const engineSlice = createSlice({
  name: "engine",
  initialState,
  reducers: {
    setEngineFields: (state, action: PayloadAction<EngineFieldSchema[]>) => {
      state.fields = action.payload;
    },
  },
});

export const { actions, reducer } = engineSlice;

export default reducer;
