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
