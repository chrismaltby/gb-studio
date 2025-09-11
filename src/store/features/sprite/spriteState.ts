import { createSlice } from "@reduxjs/toolkit";

interface SpriteState {
  detecting: boolean;
}

export const initialState: SpriteState = {
  detecting: false,
};

const spriteSlice = createSlice({
  name: "sprite",
  initialState,
  reducers: {},
});

export const { reducer } = spriteSlice;

export default reducer;
