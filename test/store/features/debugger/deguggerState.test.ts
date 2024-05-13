import reducer, {
  initialState,
  DebuggerState,
  actions,
} from "../../../../src/store/features/debugger/debuggerState";

test("Should open the build log on any console errors", () => {
  const state: DebuggerState = {
    ...initialState,
    isLogOpen: false,
  };
  const action = actions.setIsLogOpen(true);

  const newState = reducer(state, action);
  expect(newState.isLogOpen).toBe(true);
});
