import toolsReducer from "../../src/reducers/toolsReducer";
import { SET_TOOL, SELECT_TRIGGER } from "../../src/actions/actionTypes";

test("Should allow setting tool", () => {
  const state = {
    selected: "select"
  };
  const action = {
    type: SET_TOOL,
    tool: "eraser"
  };
  const newState = toolsReducer(state, action);
  expect(newState.selected).toBe("eraser");
});

test("Should switch back to select when clicking trigger", () => {
  const state = {
    selected: "trigger"
  };
  const action = {
    type: SELECT_TRIGGER
  };
  const newState = toolsReducer(state, action);
  expect(newState.selected).toBe("select");
});

test("Unknown action should return input state", () => {
  const state = {
    selected: "map"
  };
  const action = {
    type: "UNKNOWN_ACTION"
  };
  const newState = toolsReducer(state, action);
  expect(newState.selected).toBe("map");
});

test("Default state should use select tool", () => {
  const action = {
    type: "UNKNOWN_ACTION"
  };
  const newState = toolsReducer(undefined, action);
  expect(newState.selected).toBe("select");
});
