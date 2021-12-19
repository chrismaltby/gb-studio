/* eslint-disable camelcase */
import {
  AnyAction,
  createAsyncThunk,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";
import { pathExists, readFile } from "fs-extra";
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
import { projectTemplatesRoot } from "../../../consts";
import copy from "lib/helpers/fsCopy";

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

export const addNewSongFile = createAsyncThunk<string | null, string>(
  "tracker/addNewSong",
  async (path, _thunkApi): Promise<string | null> => {
    const templatePath = `${projectTemplatesRoot}/gbhtml/assets/music/template.uge`;
    const copy2 = async (oPath: string, path: string) => {
      try {
        const exists = await pathExists(path);
        if (!exists) {
          await copy(oPath, path, {
            overwrite: false,
            errorOnExist: true,
          });
          return path;
        } else {
          const [filename] = path.split(".uge");
          const matches = filename.match(/\d+$/);
          let newFilename = `${filename} 1`;
          if (matches) {
            // if filename ends with number
            const number = parseInt(matches[0]) + 1;
            newFilename = filename.replace(/\d+$/, `${number}`);
          }
          const newPath = `${newFilename}.uge`;
          await copy2(oPath, newPath);
          return newPath;
        }
      } catch (e) {
        throw new Error(e);
      }
    };
    return await copy2(templatePath, path);
  }
);

export const loadSongFile = createAsyncThunk<Song | null, string>(
  "tracker/loadSong",
  async (path, _thunkApi): Promise<Song | null> => {
    const data = await readFile(path);
    const song = loadUGESong(new Uint8Array(data).buffer);
    if (song) {
      song.filename = path;
    }
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
    const buffer = saveUGESong(song);
    await writeFileWithBackupAsync(
      song.filename,
      new Uint8Array(buffer),
      "utf8"
    );
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
        (action: AnyAction): action is AnyAction =>
          action.type.startsWith("tracker/edit") ||
          action.type.startsWith("tracker/transpose") ||
          action.type.startsWith("tracker/addSequence") ||
          action.type.startsWith("tracker/removeSequence"),
        (state, _action) => {
          state.modified = true;
        }
      ),
});

export const { actions, reducer } = trackerSlice;

export default reducer;
