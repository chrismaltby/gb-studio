import reducer, {
  initialState,
  DebuggerState,
  actions,
} from "../../../../src/store/features/debugger/debuggerState";

test("Should open the build log on any console errors", () => {
  const state: DebuggerState = {
    ...initialState,
    activePane: "debugger",
  };
  const action = actions.setActivePane("buildLog");

  const newState = reducer(state, action);
  expect(newState.activePane).toBe("buildLog");
});
