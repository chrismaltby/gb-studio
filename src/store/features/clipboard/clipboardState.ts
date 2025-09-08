import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ClipboardType } from "./clipboardTypes";

interface ClipboardState {
  data?: ClipboardType;
}

export const initialState: ClipboardState = {
  data: undefined,
};

const clipboardSlice = createSlice({
  name: "clipboard",
  initialState,
  reducers: {
    setClipboardData: (state, action: PayloadAction<ClipboardType>) => {
      state.data = action.payload;
    },
    clearClipboardData: (state) => {
      state.data = undefined;
    },
  },
});

export const { actions } = clipboardSlice;

export default clipboardSlice.reducer;
