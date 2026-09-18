import {
  createAsyncThunk,
  createSlice,
  PayloadAction,
  createAction,
  current,
} from "@reduxjs/toolkit";
import {
  Song,
  PatternCell,
  SubPatternCell,
  DutyInstrument,
  NoiseInstrument,
  WaveInstrument,
  SequenceItem,
} from "shared/lib/uge/types";
import { RootState } from "store/storeTypes";
import API from "renderer/lib/api";
import { MusicResourceAsset } from "shared/lib/resources/types";
import {
  createPatternCell,
  createPattern,
  createSequenceItem,
  createSong,
} from "shared/lib/uge/song";
import { InstrumentType } from "shared/lib/music/types";
import {
  fromAbsRow,
  getSequenceChannelCell,
  getSequenceChannelPatternId,
  getTransposeNoteDelta,
  resolveTrackerFieldPositions,
  resolveUniqueTrackerPositions,
  transposePatternCellNote,
} from "./trackerDocumentHelpers";
import { TRACKER_NUM_CHANNELS, TRACKER_PATTERN_LENGTH } from "consts";
import { PatternCellAddress } from "shared/lib/uge/editor/types";
import cloneDeep from "lodash/cloneDeep";

interface TrackerDocumentState {
  // status: "loading" | "error" | "loaded" | "init";
  // error?: string;
  song?: Song;
  // modified: boolean;
}

export const initialState: TrackerDocumentState = {
  // status: "init",
  // error: "",
  // modified: false,
};

export type PatternCellChange = {
  patternId: number;
  rowId: number;
  channelId: number;
  changes: Partial<PatternCell>;
};

export const requestAddNewSongFile = createAction<string>(
  "trackerDocument/requestAddNewSong",
);

export const addNewSongFile = createAsyncThunk<
  { data: MusicResourceAsset },
  string
>(
  "trackerDocument/addNewSong",
  async (
    path,
    _thunkApi,
  ): Promise<{
    data: MusicResourceAsset;
  }> => {
    return {
      data: await API.tracker.addNewUGEFile(path),
    };
  },
);

export const loadSongFile = createAsyncThunk<Song, string>(
  "trackerDocument/loadSong",
  async (path, _thunkApi): Promise<Song> => {
    const song = await API.tracker.loadUGEFile(path);
    return song;
  },
);

export const saveSongFile = createAsyncThunk<void, void>(
  "trackerDocument/saveSong",
  async (_, thunkApi) => {
    const state = thunkApi.getState() as RootState;

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
  },
);

const trackerSlice = createSlice({
  name: "trackerDocument",
  initialState,
  reducers: {
    unloadSong: (state, _action: PayloadAction<void>) => {
      state.song = undefined;
    },
    setSongFilename: (state, action: PayloadAction<string>) => {
      if (state.song) {
        state.song.filename = action.payload;
      }
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
      }>,
    ) => {
      if (!state.song) {
        return;
      }
      const instrument =
        state.song.dutyInstruments[_action.payload.instrumentId];
      const patch = { ..._action.payload.changes };

      if (!instrument) {
        return;
      }

      const instruments = [...state.song.dutyInstruments];
      instruments[_action.payload.instrumentId] = {
        ...instrument,
        ...patch,
      } as DutyInstrument;

      state.song = {
        ...state.song,
        dutyInstruments: instruments,
      };
    },
    editWaveInstrument: (
      state,
      _action: PayloadAction<{
        instrumentId: number;
        changes: Partial<WaveInstrument>;
      }>,
    ) => {
      if (!state.song) {
        return;
      }

      const instrument =
        state.song.waveInstruments[_action.payload.instrumentId];
      const patch = { ..._action.payload.changes };

      if (!instrument) {
        return;
      }

      const instruments = [...state.song.waveInstruments];
      instruments[_action.payload.instrumentId] = {
        ...instrument,
        ...patch,
      } as WaveInstrument;

      state.song = {
        ...state.song,
        waveInstruments: instruments,
      };
    },
    editNoiseInstrument: (
      state,
      _action: PayloadAction<{
        instrumentId: number;
        changes: Partial<NoiseInstrument>;
      }>,
    ) => {
      if (!state.song) {
        return;
      }

      const instrument =
        state.song.noiseInstruments[_action.payload.instrumentId];
      const patch = { ..._action.payload.changes };

      if (!instrument) {
        return;
      }

      const instruments = [...state.song.noiseInstruments];
      instruments[_action.payload.instrumentId] = {
        ...instrument,
        ...patch,
      } as NoiseInstrument;

      state.song = {
        ...state.song,
        noiseInstruments: instruments,
      };
    },
    editPatternCell: (
      state,
      action: PayloadAction<{
        patternId: number;
        rowId: number;
        changes: Partial<PatternCell>;
      }>,
    ) => {
      if (!state.song) {
        return;
      }

      const patternId = action.payload.patternId;
      const rowId = action.payload.rowId;
      const patternCell = state.song.patterns?.[patternId]?.[rowId];

      if (!patternCell) {
        return;
      }

      let patch = { ...action.payload.changes };
      if (
        patch.effectCode &&
        patch.effectCode !== null &&
        (patch.effectParam === null || patch.effectParam === undefined) &&
        patternCell.effectParam === null
      ) {
        // If there's an effect code but no effect param, default to 0
        patch = {
          ...patch,
          effectParam: 0,
        };
      }

      const patterns = [...state.song.patterns];
      patterns[patternId] = [...patterns[patternId]];
      patterns[patternId][rowId] = {
        ...patternCell,
        ...patch,
      };

      state.song = {
        ...state.song,
        patterns,
      };
    },

    editPatternCells: (
      state,
      action: PayloadAction<{
        patternCells: PatternCellAddress[];
        changes: Partial<PatternCell>;
      }>,
    ) => {
      if (!state.song) {
        return;
      }

      const { patternCells, changes } = action.payload;

      const seen = new Set<string>();

      for (const { sequenceId, rowId, channelId } of patternCells) {
        const resolved = getSequenceChannelCell(
          state.song,
          sequenceId,
          channelId,
          rowId,
        );

        if (!resolved) {
          continue;
        }

        const { patternId, cell } = resolved;
        const key = `${patternId}:${rowId}:${channelId}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);

        Object.assign(cell, changes);
      }
    },

    applyPatternCellChanges: (
      state,
      action: PayloadAction<{
        changes: Array<{
          patternId: number;
          rowId: number;
          channelId: number;
          changes: Partial<PatternCell>;
        }>;
      }>,
    ) => {
      if (!state.song) {
        return;
      }

      for (const change of action.payload.changes) {
        const cell = state.song.patterns?.[change.patternId]?.[change.rowId];

        if (!cell) {
          continue;
        }

        let patch = { ...change.changes };

        if (
          patch.effectCode &&
          patch.effectCode !== null &&
          (patch.effectParam === null || patch.effectParam === undefined) &&
          cell.effectParam === null
        ) {
          patch = {
            ...patch,
            effectParam: 0,
          };
        }

        state.song.patterns[change.patternId][change.rowId] = {
          ...cell,
          ...patch,
        };
      }
    },

    transposeTrackerFields: (
      state,
      action: PayloadAction<{
        sequenceId: number;
        selectedTrackerFields: number[];
        direction: "up" | "down";
      }>,
    ) => {
      if (!state.song) {
        return;
      }

      const { sequenceId, selectedTrackerFields, direction } = action.payload;
      const delta = direction === "up" ? 1 : -1;

      const resolvedFields = resolveTrackerFieldPositions(
        selectedTrackerFields,
      );

      for (const { rowIndex, channelIndex, fieldIndex } of resolvedFields) {
        const patternId = getSequenceChannelPatternId(
          state.song,
          sequenceId,
          channelIndex,
        );
        if (patternId === undefined) {
          continue;
        }

        const cell = state.song.patterns?.[patternId]?.[rowIndex];
        if (!cell) {
          continue;
        }

        if (fieldIndex === 0) {
          if (cell.note !== null) {
            cell.note = Math.max(0, Math.min(71, cell.note + delta));
          }
        } else if (fieldIndex === 1) {
          if (cell.instrument !== null) {
            cell.instrument = Math.max(
              0,
              Math.min(14, cell.instrument + delta),
            );
          }
        } else if (fieldIndex === 2) {
          if (cell.effectCode !== null) {
            cell.effectCode = Math.max(
              0,
              Math.min(15, cell.effectCode + delta),
            );
          }
        } else if (fieldIndex === 3) {
          if (cell.effectParam !== null) {
            cell.effectParam = Math.max(
              0,
              Math.min(255, cell.effectParam + delta),
            );
          }
        }
      }
    },

    transposeAbsoluteCells: (
      state,
      action: PayloadAction<{
        patternCells: PatternCellAddress[];
        direction: "up" | "down";
        size: "note" | "octave";
      }>,
    ) => {
      if (!state.song) {
        return;
      }

      const { patternCells, direction, size } = action.payload;
      const noteDelta = getTransposeNoteDelta(direction, size);

      const seen = new Set<string>();

      for (const { sequenceId, rowId, channelId } of patternCells) {
        const resolved = getSequenceChannelCell(
          state.song,
          sequenceId,
          channelId,
          rowId,
        );

        if (!resolved) {
          continue;
        }

        const { patternId, cell } = resolved;
        const key = `${patternId}:${rowId}:${channelId}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);

        transposePatternCellNote(cell, noteDelta);
      }
    },
    interpolateAbsoluteCells: (
      state,
      action: PayloadAction<{
        patternCells: PatternCellAddress[];
      }>,
    ) => {
      if (!state.song) {
        return;
      }

      const { patternCells } = action.payload;

      if (patternCells.length === 0) {
        return;
      }

      const patternCellsByChannel = new Map<number, PatternCellAddress[]>();

      for (const patternCell of patternCells) {
        const existing = patternCellsByChannel.get(patternCell.channelId);
        if (existing) {
          existing.push(patternCell);
        } else {
          patternCellsByChannel.set(patternCell.channelId, [patternCell]);
        }
      }

      for (const [channelId, channelPatternCells] of patternCellsByChannel) {
        const uniqueResolvedCells = new Map<
          string,
          {
            patternId: number;
            rowId: number;
            channelId: number;
            absRow: number;
          }
        >();

        for (const { sequenceId, rowId, channelId } of channelPatternCells) {
          const patternId = getSequenceChannelPatternId(
            state.song,
            sequenceId,
            channelId,
          );

          if (patternId === undefined) {
            continue;
          }

          const key = `${patternId}:${rowId}:${channelId}`;
          const absRow = sequenceId * TRACKER_PATTERN_LENGTH + rowId;
          const existing = uniqueResolvedCells.get(key);

          if (!existing || absRow < existing.absRow) {
            uniqueResolvedCells.set(key, {
              patternId,
              rowId,
              channelId,
              absRow,
            });
          }
        }

        const sortedResolvedCells = [...uniqueResolvedCells.values()].sort(
          (a, b) => a.absRow - b.absRow,
        );

        let startCell: {
          patternId: number;
          rowId: number;
          channelId: number;
          absRow: number;
        } | null = null;
        let startNote: number | null = null;
        let startInstrument: number | null = null;

        let endCell: {
          patternId: number;
          rowId: number;
          channelId: number;
          absRow: number;
        } | null = null;
        let endNote: number | null = null;

        for (const resolved of sortedResolvedCells) {
          const cell =
            state.song.patterns?.[resolved.patternId]?.[resolved.rowId];

          if (!cell || cell.note === null) {
            continue;
          }

          startCell = resolved;
          startNote = cell.note;
          startInstrument = cell.instrument;
          break;
        }

        for (let i = sortedResolvedCells.length - 1; i >= 0; i--) {
          const resolved = sortedResolvedCells[i];
          const cell =
            state.song.patterns?.[resolved.patternId]?.[resolved.rowId];

          if (!cell || cell.note === null) {
            continue;
          }

          endCell = resolved;
          endNote = cell.note;
          break;
        }

        if (!startCell || startNote === null || !endCell || endNote === null) {
          continue;
        }

        if (startCell.absRow >= endCell.absRow - 1) {
          continue;
        }

        const span = endCell.absRow - startCell.absRow;
        const noteDelta = endNote - startNote;

        const modifiedKeys = new Set<string>([
          `${startCell.patternId}:${startCell.rowId}:${startCell.channelId}`,
          `${endCell.patternId}:${endCell.rowId}:${endCell.channelId}`,
        ]);

        for (
          let absRow = startCell.absRow + 1;
          absRow < endCell.absRow;
          absRow++
        ) {
          const { sequenceId, rowId } = fromAbsRow(absRow);
          const patternId = getSequenceChannelPatternId(
            state.song,
            sequenceId,
            channelId,
          );

          if (patternId === undefined) {
            continue;
          }

          const key = `${patternId}:${rowId}:${channelId}`;
          if (modifiedKeys.has(key)) {
            continue;
          }
          modifiedKeys.add(key);

          const cell = state.song.patterns?.[patternId]?.[rowId];
          if (!cell) {
            continue;
          }

          const t = (absRow - startCell.absRow) / span;
          cell.note = Math.round(startNote + noteDelta * t);
          cell.instrument = startInstrument;
        }
      }
    },
    changeInstrumentAbsoluteCells: (
      state,
      action: PayloadAction<{
        patternCells: PatternCellAddress[];
        instrumentId: number;
      }>,
    ) => {
      if (!state.song) {
        return;
      }

      const { patternCells, instrumentId } = action.payload;

      const seen = new Set<string>();

      for (const { sequenceId, rowId, channelId } of patternCells) {
        const resolved = getSequenceChannelCell(
          state.song,
          sequenceId,
          channelId,
          rowId,
        );

        if (!resolved) {
          continue;
        }

        const { patternId, cell } = resolved;
        const key = `${patternId}:${rowId}:${channelId}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);

        cell.instrument = instrumentId;
      }
    },

    changeNoteAbsoluteCells: (
      state,
      action: PayloadAction<{
        patternCells: PatternCellAddress[];
        note: number;
      }>,
    ) => {
      if (!state.song) {
        return;
      }

      const { patternCells, note } = action.payload;

      const seen = new Set<string>();

      for (const { sequenceId, rowId, channelId } of patternCells) {
        const resolved = getSequenceChannelCell(
          state.song,
          sequenceId,
          channelId,
          rowId,
        );

        if (!resolved) {
          continue;
        }

        const { patternId, cell } = resolved;
        const key = `${patternId}:${rowId}:${channelId}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);

        cell.note = note;
      }
    },

    shiftTrackerFields: (
      state,
      action: PayloadAction<{
        sequenceId: number;
        selectedTrackerFields: number[];
        direction: "insert" | "delete";
      }>,
    ) => {
      if (!state.song) {
        return;
      }

      const { sequenceId, selectedTrackerFields, direction } = action.payload;
      if (selectedTrackerFields.length === 0) {
        return;
      }

      const resolvedCells = resolveUniqueTrackerPositions(
        selectedTrackerFields,
      );

      if (resolvedCells.length === 0) {
        return;
      }

      const selectedChannels = new Set<number>();
      let startRow = Infinity;

      for (const { rowIndex, channelIndex } of resolvedCells) {
        selectedChannels.add(channelIndex);
        if (rowIndex < startRow) {
          startRow = rowIndex;
        }
      }

      if (startRow < 0 || startRow >= TRACKER_PATTERN_LENGTH) {
        return;
      }

      for (const channelIndex of selectedChannels) {
        const patternId = getSequenceChannelPatternId(
          state.song,
          sequenceId,
          channelIndex,
        );
        const pattern =
          patternId !== undefined
            ? state.song.patterns?.[patternId]
            : undefined;
        if (!pattern) {
          continue;
        }

        if (direction === "delete") {
          for (let row = startRow; row < pattern.length - 1; row++) {
            pattern[row] = {
              ...pattern[row + 1],
            };
          }

          pattern[pattern.length - 1] = createPatternCell();
        } else {
          for (let row = pattern.length - 1; row > startRow; row--) {
            pattern[row] = {
              ...pattern[row - 1],
            };
          }

          pattern[startRow] = createPatternCell();
        }
      }
    },

    clearTrackerFields: (
      state,
      action: PayloadAction<{
        sequenceId: number;
        selectedTrackerFields: number[];
      }>,
    ) => {
      if (!state.song) {
        return;
      }

      const { sequenceId, selectedTrackerFields } = action.payload;

      const resolvedCells = resolveTrackerFieldPositions(selectedTrackerFields);

      for (const { rowIndex, channelIndex, fieldIndex } of resolvedCells) {
        const patternId = getSequenceChannelPatternId(
          state.song,
          sequenceId,
          channelIndex,
        );
        if (patternId === undefined) {
          continue;
        }
        const cell = state.song.patterns?.[patternId]?.[rowIndex];
        if (cell) {
          if (fieldIndex === 0) {
            cell.note = null;
          } else if (fieldIndex === 1) {
            cell.instrument = null;
          } else if (fieldIndex === 2) {
            cell.effectCode = null;
          } else if (fieldIndex === 3) {
            cell.effectParam = null;
          }
        }
      }
    },

    clearAbsoluteCells: (
      state,
      action: PayloadAction<{
        patternCells: PatternCellAddress[];
      }>,
    ) => {
      if (!state.song) {
        return;
      }

      const { patternCells } = action.payload;

      const seen = new Set<string>();

      for (const { sequenceId, rowId, channelId } of patternCells) {
        const patternId = getSequenceChannelPatternId(
          state.song,
          sequenceId,
          channelId,
        );

        if (patternId === undefined) {
          continue;
        }

        const key = `${patternId}:${rowId}:${channelId}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);

        if (state.song.patterns?.[patternId]?.[rowId]) {
          state.song.patterns[patternId][rowId] = createPatternCell();
        }
      }
    },

    editSubPatternCell: (
      state,
      _action: PayloadAction<{
        instrumentType: InstrumentType;
        instrumentId: number;
        cell: [number, number];
        changes: Partial<SubPatternCell>;
      }>,
    ) => {
      if (!state.song) {
        return;
      }

      let instruments: DutyInstrument[] | WaveInstrument[] | NoiseInstrument[];
      switch (_action.payload.instrumentType) {
        case "duty":
          instruments = [...state.song.dutyInstruments];
          break;
        case "wave":
          instruments = [...state.song.waveInstruments];
          break;
        case "noise":
          instruments = [...state.song.noiseInstruments];
          break;
      }
      const instrumentId = _action.payload.instrumentId;
      const [row, _col] = _action.payload.cell;

      const newSubPattern = [...instruments[instrumentId].subpattern];
      const newSubPatternCell = { ...newSubPattern[row] };
      let patch = { ..._action.payload.changes };
      if (
        patch.effectCode !== undefined &&
        patch.effectCode !== null &&
        newSubPatternCell.effectParam === null
      ) {
        patch = {
          ...patch,
          effectParam: 0,
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
            dutyInstruments: instruments as DutyInstrument[],
          };
          break;
        case "wave":
          state.song = {
            ...state.song,
            waveInstruments: instruments as WaveInstrument[],
          };
          break;
        case "noise":
          state.song = {
            ...state.song,
            noiseInstruments: instruments as NoiseInstrument[],
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
      }>,
    ) => {
      if (!state.song) {
        return;
      }
      let instruments: DutyInstrument[] | WaveInstrument[] | NoiseInstrument[];
      switch (_action.payload.instrumentType) {
        case "duty":
          instruments = [...state.song.dutyInstruments];
          break;
        case "wave":
          instruments = [...state.song.waveInstruments];
          break;
        case "noise":
          instruments = [...state.song.noiseInstruments];
          break;
      }

      const instrumentId = _action.payload.instrumentId;
      instruments[instrumentId].subpattern = _action.payload.subpattern;

      switch (_action.payload.instrumentType) {
        case "duty":
          state.song = {
            ...state.song,
            dutyInstruments: instruments as DutyInstrument[],
          };
          break;
        case "wave":
          state.song = {
            ...state.song,
            waveInstruments: instruments as WaveInstrument[],
          };
          break;
        case "noise":
          state.song = {
            ...state.song,
            noiseInstruments: instruments as NoiseInstrument[],
          };
          break;
      }
    },
    editWaveform: (
      state,
      _action: PayloadAction<{ index: number; waveForm: Uint8Array }>,
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
      action: PayloadAction<{ sequenceIndex: number; patternId: number }>,
    ) => {
      if (!state.song) {
        return;
      }

      const newSequence = [...state.song.sequence];

      // Assign a new empty pattern
      if (action.payload.patternId === -1) {
        const newPatterns = [...state.song.patterns];
        const newSequenceItem = createSequenceItem(
          Math.floor(newPatterns.length / 4),
        );

        newPatterns.push(
          createPattern(),
          createPattern(),
          createPattern(),
          createPattern(),
        );
        newSequence[action.payload.sequenceIndex] = newSequenceItem;

        state.song = {
          ...state.song,
          patterns: newPatterns,
          sequence: newSequence,
        };
      } else {
        newSequence[action.payload.sequenceIndex] = createSequenceItem(
          action.payload.patternId,
        );

        state.song = {
          ...state.song,
          sequence: newSequence,
        };
      }
    },
    editSequenceChannel: (
      state,
      action: PayloadAction<{
        sequenceIndex: number;
        sequenceChannelId: number;
        patternId: number;
        patternChannelId: number;
      }>,
    ) => {
      const { sequenceIndex, sequenceChannelId, patternId, patternChannelId } =
        action.payload;

      const sequence = state.song?.sequence[sequenceIndex];
      const patterns = state.song?.patterns;

      if (!sequence || !patterns) {
        return;
      }

      sequence.splitPattern = true;
      if (patternId === -1) {
        const newPatternId = Math.floor(patterns.length / 4);
        patterns.push(
          createPattern(),
          createPattern(),
          createPattern(),
          createPattern(),
        );
        sequence.channels[sequenceChannelId] =
          newPatternId * 4 + patternChannelId;
      } else {
        sequence.channels[sequenceChannelId] = patternId * 4 + patternChannelId;
      }
    },
    setSequenceSplitPattern: (
      state,
      action: PayloadAction<{
        sequenceIndex: number;
        splitPattern: boolean;
      }>,
    ) => {
      const { sequenceIndex, splitPattern } = action.payload;
      if (!state.song?.sequence[sequenceIndex]) {
        return;
      }
      const sequence = state.song?.sequence[sequenceIndex];
      sequence.splitPattern = splitPattern;
      if (!splitPattern) {
        const alignedBasePatternId =
          Math.floor(sequence.channels[0] / TRACKER_NUM_CHANNELS) *
          TRACKER_NUM_CHANNELS;

        sequence.channels[0] = alignedBasePatternId;

        for (let i = 1; i < TRACKER_NUM_CHANNELS; i++) {
          // If splitPattern disabled make sure all pattern
          // indexes are consecutive
          sequence.channels[i] = alignedBasePatternId + i;
          // If pattern doesn't exist, create it
          if (!state.song.patterns[sequence.channels[i]]) {
            state.song.patterns[sequence.channels[i]] = createPattern();
          }
        }
      }
    },
    insertSequence: (
      state,
      action: PayloadAction<{
        sequenceIndex: number;
        position: "before" | "after";
        patternId?: number;
      }>,
    ) => {
      if (!state.song) {
        return;
      }

      const { sequenceIndex, position, patternId } = action.payload;

      let newSequenceItem =
        patternId !== undefined ? createSequenceItem(patternId) : undefined;

      if (patternId === undefined) {
        const newPatterns = [...state.song.patterns];
        newSequenceItem = createSequenceItem(
          Math.floor(newPatterns.length / 4),
        );
        newPatterns.push(
          createPattern(),
          createPattern(),
          createPattern(),
          createPattern(),
        );
        state.song.patterns = newPatterns;
      }

      if (newSequenceItem === undefined) {
        return;
      }

      const newSequence = [...state.song.sequence];

      const rawInsertAt =
        position === "before" ? sequenceIndex : sequenceIndex + 1;

      const insertAt = Math.max(0, Math.min(rawInsertAt, newSequence.length));

      newSequence.splice(insertAt, 0, newSequenceItem);

      state.song.sequence = newSequence;
    },
    duplicateSequencePattern: (
      state,
      action: PayloadAction<{
        sequenceIndex: number;
        position: "before" | "after";
      }>,
    ) => {
      if (!state.song) {
        return;
      }
      const { sequenceIndex, position } = action.payload;
      const existingSequenceItem = state.song.sequence[sequenceIndex];

      if (!existingSequenceItem) {
        return;
      }
      const duplicatedSequenceItem: SequenceItem = {
        ...existingSequenceItem,
        channels: [...existingSequenceItem.channels],
      };

      const newSequence = [...state.song.sequence];

      const rawInsertAt =
        position === "before" ? sequenceIndex : sequenceIndex + 1;

      const insertAt = Math.max(0, Math.min(rawInsertAt, newSequence.length));

      newSequence.splice(insertAt, 0, duplicatedSequenceItem);

      state.song.sequence = newSequence;
    },
    cloneSequencePattern: (
      state,
      action: PayloadAction<{
        sequenceIndex: number;
        position: "before" | "after";
      }>,
    ) => {
      if (!state.song) {
        return;
      }

      const { sequenceIndex, position } = action.payload;

      const existingSequenceItem = state.song.sequence[sequenceIndex];

      if (!existingSequenceItem) {
        return;
      }

      const newPatterns = [...state.song.patterns];
      const clonedSequenceItemChannels = existingSequenceItem.channels.map(
        (patternId) => {
          const pattern = state.song?.patterns[patternId];
          if (!pattern) {
            return patternId;
          }
          const newPatternIndex = newPatterns.length;
          newPatterns.push(cloneDeep(current(pattern)));
          return newPatternIndex;
        },
      ) as [number, number, number, number];

      const clonedSequenceItem = {
        ...existingSequenceItem,
        channels: clonedSequenceItemChannels,
      };

      state.song.patterns = newPatterns;

      const newSequence = [...state.song.sequence];

      const rawInsertAt =
        position === "before" ? sequenceIndex : sequenceIndex + 1;

      const insertAt = Math.max(0, Math.min(rawInsertAt, newSequence.length));

      newSequence.splice(insertAt, 0, clonedSequenceItem);

      state.song.sequence = newSequence;
    },
    removeSequence: (
      state,
      _action: PayloadAction<{ sequenceIndex: number }>,
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
    moveSequence: (
      state,
      action: PayloadAction<{ fromIndex: number; toIndex: number }>,
    ) => {
      if (!state.song) {
        return;
      }

      const { fromIndex, toIndex } = action.payload;
      const newSequence = [...state.song.sequence];

      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= newSequence.length ||
        toIndex >= newSequence.length
      ) {
        return;
      }

      const [movedItem] = newSequence.splice(fromIndex, 1);
      if (movedItem === undefined) {
        return;
      }
      newSequence.splice(toIndex, 0, movedItem);

      state.song = {
        ...state.song,
        sequence: newSequence,
      };
    },
  },
  extraReducers: (builder) =>
    builder
      .addCase(loadSongFile.pending, (state) => {
        state.song = undefined;
      })
      .addCase(loadSongFile.rejected, (state) => {
        state.song = createSong();
      })
      .addCase(loadSongFile.fulfilled, (state, action) => {
        state.song = action.payload;
      }),
});

export const { actions } = trackerSlice;

export default trackerSlice.reducer;
