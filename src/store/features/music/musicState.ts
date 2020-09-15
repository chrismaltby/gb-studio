import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface MusicState {
  playing: boolean;
}

export const initialState: MusicState = {
  playing: false,
};

const musicSlice = createSlice({
  name: "music",
  initialState,
  reducers: {
    playMusic: (state, _action: PayloadAction<{ musicId: string }>) => {
      state.playing = true;
    },
    pauseMusic: (state, _action: PayloadAction<void>) => {
      state.playing = false;
    },
  },
});

export const { actions, reducer } = musicSlice;

export default reducer;
