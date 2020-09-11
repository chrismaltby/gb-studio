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

test("Should be able to focus on world", () => {
  const state: EditorState = {
    ...initialState,
    type: "scene",
    scene: "scene1",
    worldFocus: false
  };
  const action = actions.selectWorld();
  const newState = reducer(state, action);
  expect(newState.type).toBe("world");
  expect(newState.scene).toBe("");
  expect(newState.worldFocus).toBe(true);
});

test("Should be able to focus on sidebar", () => {
  const state: EditorState = {
    ...initialState,
    type: "scene",
    scene: "scene1",
    worldFocus: true
  };
  const action = actions.selectSidebar();
  const newState = reducer(state, action);
  expect(newState.type).toBe("scene");
  expect(newState.scene).toBe("scene1");
  expect(newState.worldFocus).toBe(false);
});

test("Should be able to hover on scene", () => {
  const state: EditorState = {
    ...initialState,
    hover: {
      sceneId: "",
      actorId: "",
      x: 0,
      y: 0
    }
  };

  const action = actions.sceneHover({
    sceneId: "scene2",
    x: 5,
    y: 7
  });
  const newState = reducer(state, action);
  expect(newState.hover.sceneId).toBe("scene2");
  expect(newState.hover.x).toBe(5);
  expect(newState.hover.y).toBe(7);
});
