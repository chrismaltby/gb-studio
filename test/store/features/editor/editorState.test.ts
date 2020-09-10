import reducer, {
  initialState,
  EditorState,
} from "../../../../src/store/features/editor/editorState";
import actions from "../../../../src/store/features/editor/editorActions";

test("Should allow setting tool", () => {
  const state: EditorState = {
    ...initialState,
    tool: "select",
  };
  const action = actions.setTool({ tool: "eraser" });
  const newState = reducer(state, action);
  expect(newState.tool).toBe("eraser");
});

test("Should switch back to select when clicking trigger", () => {
  const state: EditorState = {
    ...initialState,
    tool: "triggers",
  };
  const action = actions.selectTrigger({ triggerId: "abc", sceneId: "def" });
  const newState = reducer(state, action);
  expect(newState.tool).toBe("select");
});

test("Unknown action should return input state", () => {
  const state: EditorState = {
    ...initialState,
    tool: "scene",
  };
  const action = {
    type: "UNKNOWN_ACTION",
  };
  const newState = reducer(state, action);
  expect(newState.tool).toBe("scene");
});

test("Default state should use select tool", () => {
  const action = {
    type: "UNKNOWN_ACTION",
  };
  const newState = reducer(undefined, action);
  expect(newState.tool).toBe("select");
});

test("Should be able to set brush", () => {
  const state: EditorState = {
    ...initialState,
    selectedBrush: "8px",
  };
  const action = actions.setBrush({ brush: "fill" });
  const newState = reducer(state, action);
  expect(newState.selectedBrush).toBe("fill");
});

test("Should be able to set selected palette", () => {
  const state: EditorState = {
    ...initialState,
    selectedPalette: 0,
  };
  const action = actions.setSelectedPalette({ paletteIndex: 2 });
  const newState = reducer(state, action);
  expect(newState.selectedPalette).toBe(2);
});

test("Should be able to toggle show layers option", () => {
  const state: EditorState = {
    ...initialState,
    showLayers: false,
  };
  const action = actions.setShowLayers({ showLayers: true });
  const newState = reducer(state, action);
  expect(newState.showLayers).toBe(true);
});

test("Should be able to scroll world view", () => {
  const state: EditorState = {
    ...initialState,
    worldScrollX: 0,
    worldScrollY: 0,
  };
  const action = actions.scrollWorld({ x: 50, y: 90 });
  const newState = reducer(state, action);
  expect(newState.worldScrollX).toBe(50);
  expect(newState.worldScrollY).toBe(90);
});

test("Should be able to resize world view", () => {
  const state: EditorState = {
    ...initialState,
    worldViewWidth: 320,
    worldViewHeight: 240
  };
  const action = actions.resizeWorldView({ width: 640, height: 480 });
  const newState = reducer(state, action);
  expect(newState.worldViewWidth).toBe(640);
  expect(newState.worldViewHeight).toBe(480);
});
