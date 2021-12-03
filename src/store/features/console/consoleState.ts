import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type ConsoleStatus = "idle" | "running" | "complete" | "cancelled";

interface ConsoleLine {
  type: "out" | "err";
  text: string;
}

interface ConsoleErrorLine {
  type: "err";
  text: string;
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
    stdOut: (state, action: PayloadAction<string>) => {
      if (action.payload) {
        const line: ConsoleLine = {
          type: "out",
          text: action.payload,
        };
        state.output.push(line);
      }
    },
    stdErr: (state, action: PayloadAction<string>) => {
      if (action.payload) {
        const line: ConsoleErrorLine = {
          type: "err",
          text: action.payload,
        };
        state.output.push(line);
        state.warnings.push(line);
      }
    },
  },
});

export const { actions, reducer } = consoleSlice;

export default reducer;
