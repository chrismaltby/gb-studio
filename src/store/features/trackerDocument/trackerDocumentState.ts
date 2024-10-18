/* eslint-disable camelcase */
import {
  UnknownAction,
  createAsyncThunk,
  createSlice,
  PayloadAction,
  createAction,
} from "@reduxjs/toolkit";
import cloneDeep from "lodash/cloneDeep";
import { PatternCell } from "shared/lib/uge/song/PatternCell";
import { Song } from "shared/lib/uge/song/Song";
import { RootState } from "store/configureStore";
import {
  DutyInstrument,
  NoiseInstrument,
  WaveInstrument,
} from "./trackerDocumentTypes";
import { SubPatternCell } from "shared/lib/uge/song/SubPatternCell";
import { InstrumentType } from "store/features/editor/editorState";
import API from "renderer/lib/api";
import { MusicResourceAsset } from "shared/lib/resources/types";

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

export const requestAddNewSongFile = createAction<string>(
  "tracker/requestAddNewSong"
);

export const addNewSongFile = createAsyncThunk<
  { data: MusicResourceAsset },
  string
>("tracker/addNewSong", async (path, _thunkApi): Promise<{
  data: MusicResourceAsset;
}> => {
  return {
    data: await API.tracker.addNewUGEFile(path),
  };
});

export const loadSongFile = createAsyncThunk<Song | null, string>(
  "tracker/loadSong",
  async (path, _thunkApi): Promise<Song | null> => {
    const song = await API.tracker.loadUGEFile(path);
    return song;
  }
);

export const saveSongFile = createAsyncThunk<void, void>(
  "tracker/saveSong",
  async (_, thunkApi) => {
    const state = thunkApi.getState() as RootState;

    if (!state.trackerDocument.present.modified) {
      throw new Error("Cannot save unmodified song");
    }
    if (!state.trackerDocument.present.song) {
      throw new Error("No song selected");
    }

    const song = state.trackerDocument.present.song;
    try {
      await API.tracker.saveUGEFile(song);
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
);

const trackerSlice = createSlice({
  name: "tracker",
  initialState,
  reducers: {
    loadSong: (state, _action: PayloadAction<Song>) => {
      state.song = _action.payload;
      state.modified = false;
    },
    unloadSong: (state, _action: PayloadAction<void>) => {
      state.song = undefined;
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
    editPattern: (
      state,
      _action: PayloadAction<{
        patternId: number;
        pattern: PatternCell[][];
      }>
    ) => {
      if (!state.song) {
        return;
      }
      const patternId = _action.payload.patternId;
      const patterns = cloneDeep(state.song.patterns);
      patterns[patternId] = _action.payload.pattern;
      state.song = {
        ...state.song,
        patterns,
      };
    },
    editSubPatternCell: (
      state,
      _action: PayloadAction<{
        instrumentType: InstrumentType;
        instrumentId: number;
        cell: [number, number];
        changes: Partial<SubPatternCell>;
      }>
    ) => {
      if (!state.song) {
        return;
      }

      let instruments: DutyInstrument[] | WaveInstrument[] | NoiseInstrument[];
      switch (_action.payload.instrumentType) {
        case "duty":
          instruments = [...state.song.duty_instruments];
          break;
        case "wave":
          instruments = [...state.song.wave_instruments];
          break;
        case "noise":
          instruments = [...state.song.noise_instruments];
          break;
      }
      const instrumentId = _action.payload.instrumentId;
      const [row, _col] = _action.payload.cell;

      const newSubPattern = [...instruments[instrumentId].subpattern];
      console.log(newSubPattern);
      const newSubPatternCell = { ...newSubPattern[row] };
      let patch = { ..._action.payload.changes };
      if (
        patch.effectcode &&
        patch.effectcode !== null &&
        newSubPatternCell.effectparam === null
      ) {
        patch = {
          ...patch,
          effectparam: 0,
        };
      }

      newSubPattern[row] = { ...newSubPatternCell, ...patch };
      const newInstrument = { ...instruments[instrumentId] };
      newInstrument.subpattern = newSubPattern;

      instruments[instrumentId] = newInstrument;

      switch (_action.payload.instrumentType) {
        case "duty":
          state.song = {
            ...state.song,
            duty_instruments: instruments as DutyInstrument[],
          };
          break;
        case "wave":
          state.song = {
            ...state.song,
            wave_instruments: instruments as WaveInstrument[],
          };
          break;
        case "noise":
          state.song = {
            ...state.song,
            noise_instruments: instruments as NoiseInstrument[],
          };
          break;
      }
    },
    editSubPattern: (
      state,
      _action: PayloadAction<{
        instrumentId: number;
        instrumentType: "duty" | "wave" | "noise";
        subpattern: SubPatternCell[];
      }>
    ) => {
      if (!state.song) {
        return;
      }
      let instruments: DutyInstrument[] | WaveInstrument[] | NoiseInstrument[];
      switch (_action.payload.instrumentType) {
        case "duty":
          instruments = [...state.song.duty_instruments];
          break;
        case "wave":
          instruments = [...state.song.wave_instruments];
          break;
        case "noise":
          instruments = [...state.song.noise_instruments];
          break;
      }

      const instrumentId = _action.payload.instrumentId;
      instruments[instrumentId].subpattern = _action.payload.subpattern;

      switch (_action.payload.instrumentType) {
        case "duty":
          state.song = {
            ...state.song,
            duty_instruments: instruments as DutyInstrument[],
          };
          break;
        case "wave":
          state.song = {
            ...state.song,
            wave_instruments: instruments as WaveInstrument[],
          };
          break;
        case "noise":
          state.song = {
            ...state.song,
            noise_instruments: instruments as NoiseInstrument[],
          };
          break;
      }
    },
    editWaveform: (
      state,
      _action: PayloadAction<{ index: number; waveForm: Uint8Array }>
    ) => {
      if (!state.song) {
        return;
      }

      const newWaves = [...state.song.waves];
      newWaves[_action.payload.index] = _action.payload.waveForm;

      state.song = {
        ...state.song,
        waves: newWaves,
      };
    },
    editSequence: (
      state,
      _action: PayloadAction<{ sequenceIndex: number; sequenceId: number }>
    ) => {
      if (!state.song) {
        return;
      }

      const newSequence = [...state.song.sequence];

      // Assign a new empty pattern
      if (_action.payload.sequenceId === -1) {
        const newPatterns = [...state.song.patterns];
        const pattern = [];
        for (let n = 0; n < 64; n++)
          pattern.push([
            new PatternCell(),
            new PatternCell(),
            new PatternCell(),
            new PatternCell(),
          ]);
        newPatterns.push(pattern);

        newSequence[_action.payload.sequenceIndex] = newPatterns.length - 1;

        state.song = {
          ...state.song,
          patterns: newPatterns,
          sequence: newSequence,
        };
      } else {
        newSequence[_action.payload.sequenceIndex] = _action.payload.sequenceId;

        state.song = {
          ...state.song,
          sequence: newSequence,
        };
      }
    },
    addSequence: (state) => {
      if (!state.song) {
        return;
      }

      const newPatterns = [...state.song.patterns];
      const pattern = [];
      for (let n = 0; n < 64; n++)
        pattern.push([
          new PatternCell(),
          new PatternCell(),
          new PatternCell(),
          new PatternCell(),
        ]);
      newPatterns.push(pattern);

      const newSequence = [...state.song.sequence];
      newSequence.push(newPatterns.length - 1);

      state.song = {
        ...state.song,
        patterns: newPatterns,
        sequence: newSequence,
      };
    },
    removeSequence: (
      state,
      _action: PayloadAction<{ sequenceIndex: number }>
    ) => {
      if (!state.song) {
        return;
      }

      const newSequence = [...state.song.sequence];
      if (newSequence.length > 1) {
        newSequence.splice(_action.payload.sequenceIndex, 1);

        state.song = {
          ...state.song,
          sequence: newSequence,
        };
      }
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
      .addCase(addNewSongFile.pending, (state, action) => {
        console.log(state, action);
      })
      .addCase(addNewSongFile.rejected, (state, action) => {
        console.error(action.error);
      })
      .addCase(addNewSongFile.fulfilled, (state, action) => {
        console.log(state, action);
      })
      .addCase(saveSongFile.fulfilled, (state, _action) => {
        state.modified = false;
      })
      .addMatcher(
        (action: UnknownAction): action is UnknownAction =>
          action.type.startsWith("tracker/edit") ||
          action.type.startsWith("tracker/addSequence") ||
          action.type.startsWith("tracker/removeSequence"),
        (state, _action) => {
          state.modified = true;
        }
      ),
});

export const { actions, reducer } = trackerSlice;

export default reducer;
