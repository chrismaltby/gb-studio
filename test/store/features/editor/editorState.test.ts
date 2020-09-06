import reducer, { initialState, actions, EditorState } from "../../../../src/store/features/editor/editorState";

test("Should allow setting tool", () => {
  const state: EditorState = {
    ...initialState,
    tool: "select"
  };
  const action = actions.setTool({ tool: "eraser" })
  const newState = reducer(state, action);
  expect(newState.tool).toBe("eraser");
});

test("Should switch back to select when clicking trigger", () => {
  const state: EditorState = {
    ...initialState,
    tool: "triggers"
  };
  const action = actions.selectTrigger({triggerId: "abc", sceneId: "def"});
  const newState = reducer(state, action);
  expect(newState.tool).toBe("select");
});

test("Unknown action should return input state", () => {
  const state: EditorState = {
    ...initialState,
    tool: "scene"
  };
  const action = {
    type: "UNKNOWN_ACTION"
  };
  const newState = reducer(state, action);
  expect(newState.tool).toBe("scene");
});

test("Default state should use select tool", () => {
  const action = {
    type: "UNKNOWN_ACTION"
  };
  const newState = reducer(undefined, action);
  expect(newState.tool).toBe("select");
});
