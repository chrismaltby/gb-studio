import reducer, {
  initialState,
  DebuggerState,
} from "../../../../src/store/features/debugger/debuggerState";
import consoleActions from "../../../../src/store/features/console/consoleActions";

test("Should open the build log on any console errors", () => {
  const state: DebuggerState = {
    ...initialState,
    isLogOpen: false,
  };
  const action = consoleActions.stdErr("Failed to build");

  const newState = reducer(state, action);
  expect(newState.isLogOpen).toBe(true);
});
