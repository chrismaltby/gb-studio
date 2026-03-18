/* eslint-disable camelcase */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import editorActions from "store/features/editor/editorActions";
import type { MusicExportFormat } from "shared/lib/music/types";
import clamp from "shared/lib/helpers/clamp";
import { MAX_EXPORT_LOOPS, MIN_EXPORT_LOOPS } from "shared/lib/music/constants";

export type PianoRollToolType = "pencil" | "eraser" | "selection" | null;

export type TrackerViewType = "tracker" | "roll";

interface TrackerState {
  // status: "loading" | "error" | "loaded" | null,
  // error?: string;
  playing: boolean;
  exporting: boolean;
  playerReady: boolean;
  // song?: Song;
  octaveOffset: number;
  editStep: number;
  // modified: boolean;
  view: TrackerViewType;
  tool: PianoRollToolType;
  defaultInstruments: [number, number, number, number];
  selectedChannel: number;
  visibleChannels: number[];
  hoverNote: number | null;
  hoverColumn: number | null;
  hoverSequence: number | null;
  startPlaybackPosition: [number, number];
  defaultStartPlaybackPosition: [number, number];
  selectedPatternCells: number[];
  selection: [number, number, number, number];
  selectedEffectCell: number | null;
  subpatternEditorFocus: boolean;
  exportFormat: MusicExportFormat;
  exportLoopCount: number;
}

export const initialState: TrackerState = {
  // status: null,
  // error: "",
  playing: false,
  exporting: false,
  playerReady: false,
  // song: null,
  octaveOffset: 0,
  editStep: 1,
  // modified: false,
  view: "roll",
  tool: "pencil",
  defaultInstruments: [0, 0, 0, 0],
  selectedChannel: 0,
  visibleChannels: [0, 1, 2, 3],
  hoverNote: null,
  hoverColumn: null,
  hoverSequence: null,
  startPlaybackPosition: [0, 0],
  defaultStartPlaybackPosition: [0, 0],
  selectedPatternCells: [],
  selection: [-1, -1, -1, -1],
  selectedEffectCell: null,
  subpatternEditorFocus: false,
  exportFormat: "mp3",
  exportLoopCount: 1,
};

const trackerSlice = createSlice({
  name: "tracker",
  initialState,
  reducers: {
    init: (state) => ({ ...initialState, view: state.view }),
    playTracker: (state, _action: PayloadAction<void>) => {
      state.playing = true;
    },
    pauseTracker: (state, _action: PayloadAction<void>) => {
      state.playing = false;
    },
    stopTracker: (state, _action: PayloadAction<void>) => {
      state.playing = false;
      state.startPlaybackPosition = [...state.defaultStartPlaybackPosition];
    },
    setExporting: (state, action: PayloadAction<boolean>) => {
      state.exporting = action.payload;
      if (action.payload) {
        state.playing = false;
      }
    },
    playerReady: (state, _action: PayloadAction<boolean>) => {
      state.playerReady = _action.payload;
    },
    setView: (state, action: PayloadAction<TrackerViewType>) => {
      state.view = action.payload;
    },
    setHover: (
      state,
      action: PayloadAction<{
        note: number | null;
        column: number | null;
        sequenceId: number | null;
      }>,
    ) => {
      state.hoverNote = action.payload.note;
      state.hoverColumn = action.payload.column;
      state.hoverSequence = action.payload.sequenceId;
    },
    setTool: (state, _action: PayloadAction<PianoRollToolType>) => {
      state.tool = _action.payload;
    },
    setDefaultInstruments: (
      state,
      _action: PayloadAction<[number, number, number, number]>,
    ) => {
      state.defaultInstruments = _action.payload;
    },
    setSelectedChannel: (state, _action: PayloadAction<number>) => {
      state.selectedPatternCells = [];
      state.selectedEffectCell = null;
      state.selectedChannel = _action.payload;
    },
    setVisibleChannels: (state, _action: PayloadAction<number[]>) => {
      state.visibleChannels = _action.payload;
    },
    setOctaveOffset: (state, _action: PayloadAction<number>) => {
      state.octaveOffset = _action.payload;
    },
    setEditStep: (state, _action: PayloadAction<number>) => {
      state.editStep = _action.payload;
    },
    setDefaultStartPlaybackPosition: (
      state,
      _action: PayloadAction<[number, number]>,
    ) => {
      state.startPlaybackPosition = _action.payload;
      state.defaultStartPlaybackPosition = _action.payload;
    },
    setSelectedPatternCells: (state, _action: PayloadAction<number[]>) => {
      state.selectedEffectCell = null;
      state.selectedPatternCells = _action.payload;
    },
    setSelectedEffectCell: (state, _action: PayloadAction<number | null>) => {
      state.selectedPatternCells = [];
      state.selectedEffectCell = _action.payload;
    },
    setSubpatternEditorFocus: (state, _action: PayloadAction<boolean>) => {
      console.log("FOCUS:", _action.payload);
      state.subpatternEditorFocus = _action.payload;
    },
    setExportSettings: (
      state,
      action: PayloadAction<{
        format: MusicExportFormat;
        loopCount: number;
      }>,
    ) => {
      state.exportFormat = action.payload.format;
      state.exportLoopCount = clamp(
        Math.floor(action.payload.loopCount),
        MIN_EXPORT_LOOPS,
        MAX_EXPORT_LOOPS,
      );
    },
  },
  extraReducers: (builder) =>
    builder.addCase(editorActions.setSelectedSongId, (state, _action) => {
      state.playing = false;
      state.playerReady = false;
    }),
});

export const { actions } = trackerSlice;

export default trackerSlice.reducer;
