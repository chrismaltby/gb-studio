import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createDefaultSong, Song } from "../../../lib/helpers/uge/song/Song";
import { DutyInstrument, NoiseInstrument, WaveInstrument } from "./trackerTypes";

export interface TrackerState {
  playing: boolean;
  song: Song;
}

export const initialState: TrackerState = {
  playing: false,
  song: createDefaultSong()
};

const trackerSlice = createSlice({
  name: "tracker",
  initialState,
  reducers: {
    loadSong: (state, _action: PayloadAction<Song>) => {
      state.song = _action.payload;
    },
    playTracker: (state, _action: PayloadAction<void>) => {
      state.playing = true;
    },
    pauseTracker: (state, _action: PayloadAction<void>) => {
      state.playing = false;
    },
    editSong: (state, _action: PayloadAction<{ changes: Partial<Song> }>) => {
      console.log(_action.payload);
      state.song = {
        ...state.song,
        ..._action.payload.changes
      }
      console.log(state.song)
    },
    editDutyInstrument: (state, _action: PayloadAction<{ instrumentId: number, changes: Partial<DutyInstrument>}>) => {
      const instrument = state.song.duty_instruments[_action.payload.instrumentId];
      let patch = { ..._action.payload.changes }

      if (!instrument) {
        return;
      }

      const instruments = [...state.song.duty_instruments];
      instruments[_action.payload.instrumentId] = { 
        ...instrument,
        ...patch 
      } as DutyInstrument;

      state.song = 
      {
        ...state.song,
        duty_instruments: instruments
      }
    },
    editWaveInstrument: (state, _action: PayloadAction<{ instrumentId: number, changes: Partial<WaveInstrument>}>) => {
      const instrument = state.song.wave_instruments[_action.payload.instrumentId];
      let patch = { ..._action.payload.changes }

      if (!instrument) {
        return;
      }

      const instruments = [...state.song.wave_instruments];
      instruments[_action.payload.instrumentId] = { 
        ...instrument,
        ...patch 
      } as WaveInstrument;

      state.song = 
      {
        ...state.song,
        wave_instruments: instruments
      }
    },
    editNoiseInstrument: (state, _action: PayloadAction<{ instrumentId: number, changes: Partial<NoiseInstrument>}>) => {
      const instrument = state.song.noise_instruments[_action.payload.instrumentId];
      let patch = { ..._action.payload.changes }

      if (!instrument) {
        return;
      }

      const instruments = [...state.song.noise_instruments];
      instruments[_action.payload.instrumentId] = { 
        ...instrument,
        ...patch 
      } as NoiseInstrument;

      state.song = 
      {
        ...state.song,
        noise_instruments: instruments
      }
    }
  },
});

export const { actions, reducer } = trackerSlice;

export default reducer;
