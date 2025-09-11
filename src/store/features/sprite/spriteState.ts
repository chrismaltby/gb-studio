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

export default spriteSlice.reducer;
