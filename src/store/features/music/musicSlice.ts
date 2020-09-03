import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface MusicState {
  playing: boolean;
}

const initialState: MusicState = {
  playing: false,
};

const musicSlice = createSlice({
  name: "music",
  initialState,
  reducers: {
    playMusic: (state, _action: PayloadAction<{ filename: string }>) => {
      state.playing = true;
    },
    pauseMusic: (state, _action: PayloadAction<void>) => {
      state.playing = false;
    },
  },
});

export const { actions, reducer } = musicSlice;

export const { playMusic, pauseMusic } = actions;

export default reducer;
