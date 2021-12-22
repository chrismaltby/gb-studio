/* eslint-disable camelcase */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import editorActions from "../editor/editorActions";

export type PianoRollToolType = "pencil" | "eraser" | "selection" | null;
export interface TrackerState {
  // status: "loading" | "error" | "loaded" | null,
  // error?: string;
  playing: boolean;
  playerReady: boolean;
  // song?: Song;
  octaveOffset: number;
  editStep: number;
  // modified: boolean;
  view: "tracker" | "roll";
  tool: PianoRollToolType;
  defaultInstruments: [number, number, number, number];
  selectedChannel: number;
  visibleChannels: number[];
  hoverNote: number | null;
  startPlaybackPosition: [number, number];
  defaultStartPlaybackPosition: [number, number];
}

export const initialState: TrackerState = {
  // status: null,
  // error: "",
  playing: false,
  playerReady: false,
  // song: null,
  octaveOffset: 0,
  editStep: 1,
  // modified: false,
  view: "roll",
  tool: "pencil",
  defaultInstruments: [0, 0, 0, 0],
  selectedChannel: 0,
  visibleChannels: [0],
  hoverNote: null,
  startPlaybackPosition: [0, 0],
  defaultStartPlaybackPosition: [0, 0],
};

const trackerSlice = createSlice({
  name: "tracker",
  initialState,
  reducers: {
    init: () => initialState,
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
    playerReady: (state, _action: PayloadAction<boolean>) => {
      state.playerReady = _action.payload;
    },
    toggleView: (state, _action: PayloadAction<"tracker" | "roll">) => {
      state.view = _action.payload;
    },
    setHoverNote: (state, action: PayloadAction<number | null>) => {
      state.hoverNote = action.payload;
    },
    setTool: (state, _action: PayloadAction<PianoRollToolType>) => {
      state.tool = _action.payload;
    },
    setDefaultInstruments: (
      state,
      _action: PayloadAction<[number, number, number, number]>
    ) => {
      state.defaultInstruments = _action.payload;
    },
    setSelectedChannel: (state, _action: PayloadAction<number>) => {
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
      _action: PayloadAction<[number, number]>
    ) => {
      state.startPlaybackPosition = _action.payload;
      state.defaultStartPlaybackPosition = _action.payload;
    },
  },
  extraReducers: (builder) =>
    builder.addCase(editorActions.setSelectedSongId, (state, _action) => {
      state.playing = false;
      state.playerReady = false;
    }),
});

export const { actions, reducer } = trackerSlice;

export default reducer;
