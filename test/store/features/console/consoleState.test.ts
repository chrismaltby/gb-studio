import reducer, {
  initialState,
  ConsoleState,
} from "../../../../src/store/features/console/consoleState";
import actions from "../../../../src/store/features/console/consoleActions";

test("Should be able to write to console", () => {
  const state: ConsoleState = {
    ...initialState,
    output: [],
  };
  const action = actions.stdOut("Message");
  const newState = reducer(state, action);
  expect(newState.output).toEqual([
    {
      type: "out",
      text: "Message",
    },
  ]);
  expect(newState.warnings).toEqual([]);
});

test("Should be able to write errors to output and warnings list", () => {
  const state: ConsoleState = {
    ...initialState,
    output: [],
  };
  const action = actions.stdErr("Message");
  const newState = reducer(state, action);
  expect(newState.output).toEqual([
    {
      type: "err",
      text: "Message",
    },
  ]);
  expect(newState.warnings).toEqual([
    {
      type: "err",
      text: "Message",
    },
  ]);
});

test("Should be able to clear console", () => {
  const state: ConsoleState = {
    ...initialState,
    output: [
      {
        type: "out",
        text: "Message 1",
      },
    ],
    warnings: [
      {
        type: "err",
        text: "Message 2",
      },
    ],
  };
  const action = actions.clearConsole();
  const newState = reducer(state, action);
  expect(newState.output).toEqual([]);
  expect(newState.warnings).toEqual([]);
});

test("Should be able to set the build status as running causing console to clear", () => {
  const state: ConsoleState = {
    ...initialState,
    status: "idle",
    output: [
      {
        type: "out",
        text: "Message 1",
      },
    ],
    warnings: [
      {
        type: "err",
        text: "Message 2",
      },
    ],
  };
  const action = actions.startConsole();
  const newState = reducer(state, action);
  expect(newState.status).toBe("running");
  expect(newState.output).toEqual([]);
  expect(newState.warnings).toEqual([]);
});

test("Should be able to mark the build status as complete", () => {
  const state: ConsoleState = {
    ...initialState,
    status: "running",
    output: [
      {
        type: "out",
        text: "Message 1",
      },
    ],
    warnings: [
      {
        type: "err",
        text: "Message 2",
      },
    ],
  };
  const action = actions.completeConsole();
  const newState = reducer(state, action);
  expect(newState.status).toBe("complete");
  expect(newState.output).toEqual(state.output);
  expect(newState.warnings).toEqual(state.warnings);
});
