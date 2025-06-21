import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import l10n from "shared/lib/lang/l10n";
import type { EditorSelectionType } from "store/features/editor/editorState";

type ConsoleStatus = "idle" | "running" | "complete" | "cancelled";

export interface ConsoleLink {
  linkText: string;
  type: EditorSelectionType;
  entityId: string;
  sceneId: string;
}

interface ConsoleLine {
  type: "out" | "err";
  text: string;
  link?: ConsoleLink;
}

interface ConsoleErrorLine {
  type: "err";
  text: string;
  link?: ConsoleLink;
}

export interface ConsoleState {
  status: ConsoleStatus;
  output: ConsoleLine[];
  warnings: ConsoleErrorLine[];
}

export const initialState: ConsoleState = {
  status: "idle",
  output: [],
  warnings: [],
};

const consoleSlice = createSlice({
  name: "console",
  initialState,
  reducers: {
    clearConsole: (state, _action: PayloadAction<void>) => {
      if (state.status !== "running") {
        state.status = "idle";
      }
      state.output = [];
      state.warnings = [];
    },
    startConsole: (state, _action: PayloadAction<void>) => {
      state.status = "running";
      state.output = [];
      state.warnings = [];
    },
    completeConsole: (state, _action: PayloadAction<void>) => {
      state.status = "complete";
    },
    cancelConsole: (state, _action: PayloadAction<void>) => {
      if (state.status === "running") {
        state.status = "cancelled";
      }
    },
    stdOut: (
      state,
      action: PayloadAction<{ text: string; link?: ConsoleLink }>,
    ) => {
      if (
        action.payload &&
        // When cancelling only allow cancelled message to be output
        // to clear backlog of progress messages
        (state.status !== "cancelled" ||
          action.payload.text === l10n("BUILD_CANCELLED"))
      ) {
        const line: ConsoleLine = {
          type: "out",
          ...action.payload,
        };
        state.output.push(line);
      }
    },
    stdErr: (
      state,
      action: PayloadAction<{ text: string; link?: ConsoleLink }>,
    ) => {
      if (action.payload) {
        const line: ConsoleErrorLine = {
          type: "err",
          ...action.payload,
        };
        state.output.push(line);
        state.warnings.push(line);
      }
    },
  },
});

export const { actions, reducer } = consoleSlice;

export default reducer;
