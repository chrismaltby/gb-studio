/* eslint-disable camelcase */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { number } from "prop-types";
import { PatternCell } from "../../../lib/helpers/uge/song/PatternCell";
import { createDefaultSong, Song } from "../../../lib/helpers/uge/song/Song";
import editorActions from "../editor/editorActions";
import { DutyInstrument, NoiseInstrument, WaveInstrument } from "./trackerTypes";

export interface TrackerState {
  playing: boolean;
  song: Song;
  octaveOffset: number;
  editStep: number;
}

export const initialState: TrackerState = {
  playing: false,
  song: createDefaultSong(),
  octaveOffset: 0,
  editStep: 1,
};

const NUM_NOTES = 72;

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
      state.song = {
        ...state.song,
        ..._action.payload.changes
      }
    },
    editDutyInstrument: (state, _action: PayloadAction<{ instrumentId: number, changes: Partial<DutyInstrument>}>) => {
      const instrument = state.song.duty_instruments[_action.payload.instrumentId];
      const patch = { ..._action.payload.changes }

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
      const patch = { ..._action.payload.changes }

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
      const patch = { ..._action.payload.changes }

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
    },
    editPatternCell: (state, _action: PayloadAction<{ patternId: number, cellId: number, changes: Partial<PatternCell>}>) => {
      const patternId = _action.payload.patternId;
      const rowId = Math.floor(_action.payload.cellId / 16);
      const colId = Math.floor(_action.payload.cellId / 4) % 4
      const patternCell = state.song.patterns[patternId][rowId][colId];

      let patch = { ..._action.payload.changes }
      if (patch.effectcode && patch.effectcode !== null && patternCell.effectparam === null) {
        patch = {
          ...patch,
          effectparam: 0
        }
      }

      const patterns = [...state.song.patterns];
      patterns[patternId][rowId][colId] = {
        ...patternCell,
        ...patch
      };

      state.song = 
      {
        ...state.song,
        patterns: patterns
      }
    },
    transposeNoteCell: (state, _action: PayloadAction<{ patternId: number, cellId: number, transpose: number}>) => {
      const patternId = _action.payload.patternId;
      const rowId = Math.floor(_action.payload.cellId / 16);
      const colId = Math.floor(_action.payload.cellId / 4) % 4
      const patternCell = state.song.patterns[patternId][rowId][colId];

      const newNote = patternCell.note === null ? 0 : patternCell.note + _action.payload.transpose;

      const patterns = [...state.song.patterns];
      patterns[patternId][rowId][colId] = {
        ...patternCell,
        note: (newNote % NUM_NOTES + NUM_NOTES) % NUM_NOTES
      };

      state.song = 
      {
        ...state.song,
        patterns: patterns
      }
    },
    setOctaveOffset: (state, _action: PayloadAction<number>) => {
      state.octaveOffset = _action.payload;
    },
    setEditStep: (state, _action: PayloadAction<number>) => {
      state.editStep = _action.payload;
    },
  },
  extraReducers: (builder) =>
    builder
      .addCase(editorActions.setSelectedSongId, (state, action) => {
        state.playing = false;
      })
});

export const { actions, reducer } = trackerSlice;

export default reducer;
