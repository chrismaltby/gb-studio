import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type ConsoleStatus = "idle" | "running" | "complete";

interface ConsoleLine {
  type: "out" | "err";
  text: string;
}

interface ConsoleErrorLine {
  type: "err";
  text: string;
}

interface ConsoleState {
  status: ConsoleStatus;
  output: ConsoleLine[];
  warnings: ConsoleErrorLine[];
}

const initialState: ConsoleState = {
  status: "idle",
  output: [],
  warnings: [],
};

const consoleSlice = createSlice({
  name: "console",
  initialState,
  reducers: {
    clearConsole: (state, _action) => {
      state.status = "idle";
      state.output = [];
      state.warnings = [];
    },
    startConsole: (state, _action) => {
      state.status = "running";
      state.output = [];
      state.warnings = [];
    },
    completeConsole: (state, _action) => {
      state.status = "complete";
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

const { actions, reducer } = consoleSlice;

export const {
  clearConsole,
  startConsole,
  completeConsole,
  stdOut,
  stdErr,
} = actions;

export default reducer;
