import { createSlice } from "@reduxjs/toolkit";

export interface SpriteState {
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

export const { actions, reducer } = spriteSlice;

export default reducer;
