import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { WebTemplateInfo } from "shared/lib/webTemplates/types";

export interface WebTemplatesState {
  templates: WebTemplateInfo[];
}

export const initialState: WebTemplatesState = {
  templates: [],
};

const webTemplatesSlice = createSlice({
  name: "webTemplates",
  initialState,
  reducers: {
    setWebTemplates: (state, action: PayloadAction<WebTemplateInfo[]>) => {
      state.templates = action.payload;
    },
  },
});

export const { actions } = webTemplatesSlice;

export default webTemplatesSlice.reducer;
