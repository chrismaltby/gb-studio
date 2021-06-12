/* eslint-disable camelcase */
import {
  AnyAction,
  createAsyncThunk,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";
import { readFile } from "fs-extra";
import cloneDeep from "lodash/cloneDeep";
import { writeFileWithBackupAsync } from "lib/helpers/fs/writeFileWithBackup";
import { PatternCell } from "lib/helpers/uge/song/PatternCell";
import { Song } from "lib/helpers/uge/song/Song";
import { loadUGESong, saveUGESong } from "lib/helpers/uge/ugeHelper";
import { RootState } from "store/configureStore";
import {
  DutyInstrument,
  NoiseInstrument,
  WaveInstrument,
} from "./trackerDocumentTypes";

export interface TrackerDocumentState {
  status: "loading" | "error" | "loaded" | null;
  error?: string;
  song?: Song;
  modified: boolean;
}

export const initialState: TrackerDocumentState = {
  status: null,
  error: "",
  modified: false,
};

export const loadSongFile = createAsyncThunk<Song | null, string>(
  "tracker/loadSong",
  async (path, _thunkApi): Promise<Song | null> => {
    const data = await readFile(path);
    const song = loadUGESong(new Uint8Array(data).buffer);

    return song;
  }
);

export const saveSongFile = createAsyncThunk<void, string | undefined>(
  "tracker/saveSong",
  async (path, thunkApi) => {
    const state = thunkApi.getState() as RootState;

    // if (!state.document.loaded) {
    //   throw new Error("Cannot save project that has not finished loading");
    // }
    // if (saving) {
    //   throw new Error("Cannot save project while already saving");
    // }
    if (!path && !state.trackerDocument.present.modified) {
      throw new Error("Cannot save unmodified song");
    }
    if (!state.trackerDocument.present.song) {
      throw new Error("No song selected");
    }

    const buffer = saveUGESong(state.trackerDocument.present.song);
    await writeFileWithBackupAsync(path, new Uint8Array(buffer), "utf8");
  }
);

const NUM_NOTES = 72;

const trackerSlice = createSlice({
  name: "tracker",
  initialState,
  reducers: {
    loadSong: (state, _action: PayloadAction<Song>) => {
      state.song = _action.payload;
      state.modified = false;
    },
    editSong: (state, _action: PayloadAction<{ changes: Partial<Song> }>) => {
      if (state.song) {
        state.song = {
          ...state.song,
          ..._action.payload.changes,
        };
      }
    },
    editDutyInstrument: (
      state,
      _action: PayloadAction<{
        instrumentId: number;
        changes: Partial<DutyInstrument>;
      }>
    ) => {
      if (!state.song) {
        return;
      }
      const instrument =
        state.song.duty_instruments[_action.payload.instrumentId];
      const patch = { ..._action.payload.changes };

      if (!instrument) {
        return;
      }

      const instruments = [...state.song.duty_instruments];
      instruments[_action.payload.instrumentId] = {
        ...instrument,
        ...patch,
      } as DutyInstrument;

      state.song = {
        ...state.song,
        duty_instruments: instruments,
      };
    },
    editWaveInstrument: (
      state,
      _action: PayloadAction<{
        instrumentId: number;
        changes: Partial<WaveInstrument>;
      }>
    ) => {
      if (!state.song) {
        return;
      }

      const instrument =
        state.song.wave_instruments[_action.payload.instrumentId];
      const patch = { ..._action.payload.changes };

      if (!instrument) {
        return;
      }

      const instruments = [...state.song.wave_instruments];
      instruments[_action.payload.instrumentId] = {
        ...instrument,
        ...patch,
      } as WaveInstrument;

      state.song = {
        ...state.song,
        wave_instruments: instruments,
      };
    },
    editNoiseInstrument: (
      state,
      _action: PayloadAction<{
        instrumentId: number;
        changes: Partial<NoiseInstrument>;
      }>
    ) => {
      if (!state.song) {
        return;
      }

      const instrument =
        state.song.noise_instruments[_action.payload.instrumentId];
      const patch = { ..._action.payload.changes };

      if (!instrument) {
        return;
      }

      const instruments = [...state.song.noise_instruments];
      instruments[_action.payload.instrumentId] = {
        ...instrument,
        ...patch,
      } as NoiseInstrument;

      state.song = {
        ...state.song,
        noise_instruments: instruments,
      };
    },
    editPatternCell: (
      state,
      _action: PayloadAction<{
        patternId: number;
        cell: [number, number];
        changes: Partial<PatternCell>;
      }>
    ) => {
      if (!state.song) {
        return;
      }

      const patternId = _action.payload.patternId;
      const rowId = _action.payload.cell[0];
      const colId = _action.payload.cell[1];
      const patternCell = state.song.patterns[patternId][rowId][colId];

      let patch = { ..._action.payload.changes };
      if (
        patch.effectcode &&
        patch.effectcode !== null &&
        patternCell.effectparam === null
      ) {
        patch = {
          ...patch,
          effectparam: 0,
        };
      }

      const patterns = cloneDeep(state.song.patterns);
      patterns[patternId][rowId][colId] = {
        ...patternCell,
        ...patch,
      };

      state.song = {
        ...state.song,
        patterns: patterns,
      };
    },
    editSequence: (
      state,
      _action: PayloadAction<{ sequenceIndex: number; sequenceId: number }>
    ) => {
      if (!state.song) {
        return;
      }

      const newSequence = state.song.sequence;
      newSequence[_action.payload.sequenceIndex] = _action.payload.sequenceId;

      state.song = {
        ...state.song,
        sequence: newSequence,
      };
    },
    transposeNoteCell: (
      state,
      _action: PayloadAction<{
        patternId: number;
        cellId: number;
        transpose: number;
      }>
    ) => {
      if (!state.song) {
        return;
      }

      const patternId = _action.payload.patternId;
      const rowId = Math.floor(_action.payload.cellId / 16);
      const colId = Math.floor(_action.payload.cellId / 4) % 4;
      const patternCell = state.song.patterns[patternId][rowId][colId];

      const newNote =
        patternCell.note === null
          ? 0
          : patternCell.note + _action.payload.transpose;

      const patterns = [...state.song.patterns];
      patterns[patternId][rowId][colId] = {
        ...patternCell,
        note: ((newNote % NUM_NOTES) + NUM_NOTES) % NUM_NOTES,
      };

      state.song = {
        ...state.song,
        patterns: patterns,
      };
    },
  },
  extraReducers: (builder) =>
    builder
      .addCase(loadSongFile.pending, (state, _action) => {
        state.status = "loading";
      })
      .addCase(loadSongFile.rejected, (state, action) => {
        console.error(action.error);
        state.status = "error";
        state.song = new Song();
        state.error = action.error.message;
      })
      .addCase(loadSongFile.fulfilled, (state, action) => {
        if (action.payload) {
          state.song = action.payload;
          state.status = "loaded";
          state.modified = false;
        }
      })
      .addCase(saveSongFile.fulfilled, (state, _action) => {
        state.modified = false;
      })
      .addMatcher(
        (action: AnyAction): action is AnyAction =>
          action.type.startsWith("tracker/edit") ||
          action.type.startsWith("tracker/transpose"),
        (state, _action) => {
          state.modified = true;
        }
      ),
});

export const { actions, reducer } = trackerSlice;

export default reducer;
