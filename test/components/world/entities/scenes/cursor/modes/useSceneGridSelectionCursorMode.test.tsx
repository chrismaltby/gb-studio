/** @jest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { useSceneGridSelectionCursorMode } from "components/world/entities/scenes/cursor/modes/useSceneGridSelectionCursorMode";
import type {
  SceneCursorMouseDownRawEvent,
  SceneCursorEvent,
} from "components/world/entities/scenes/cursor/modes/SceneCursorMode";
import { BRUSH_SELECTION, TOOL_TILES } from "consts";
import { dummySceneNormalized } from "../../../../../../dummydata";
import type { EditorState } from "store/features/editor/editorState";

const mockDispatch = jest.fn();
const mockEditor = {
  tool: TOOL_TILES,
  selectedBrush: BRUSH_SELECTION,
  selectedTilemapLayerId: "layer1",
  scenePaintSelection: undefined,
} as Pick<
  EditorState,
  "tool" | "selectedBrush" | "selectedTilemapLayerId" | "scenePaintSelection"
>;
const mockScene = {
  ...dummySceneNormalized,
  id: "scene1",
  width: 4,
  height: 4,
  tilemap: {
    tilesets: [],
    tileColors: new Array(16).fill(0),
    layers: [
      {
        id: "layer1",
        name: "Layer 1",
        visible: true,
        tiles: new Array(16).fill(0),
      },
    ],
  },
};
const mockState = { editor: mockEditor };
const mockStore = { getState: () => mockState };

jest.mock("store/hooks", () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (state: typeof mockState) => unknown) =>
    selector(mockState),
  useAppStore: () => mockStore,
}));

jest.mock("store/features/entities/entitiesSelectors", () => ({
  sceneSelectors: { selectById: () => mockScene },
}));

jest.mock("ui/icons/Icons", () => ({
  SelectionIcon: () => null,
}));

const mouseEvent = (
  x: number,
  y: number,
): SceneCursorEvent<SceneCursorMouseDownRawEvent> => ({
  x,
  y,
  pX: x * 8,
  pY: y * 8,
  sceneId: "scene1",
  isOverScene: true,
  raw: {
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    nativeEvent: { which: 1 } as MouseEvent,
  },
});

const moveEvent = (x: number, y: number) => ({
  x,
  y,
  pX: x * 8,
  pY: y * 8,
  sceneId: "scene1",
  isOverScene: true,
  raw: {} as MouseEvent,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockEditor.tool = TOOL_TILES;
  mockEditor.selectedBrush = BRUSH_SELECTION;
  mockEditor.selectedTilemapLayerId = "layer1";
  mockEditor.scenePaintSelection = undefined;
});

test("tile selections carry the selected layer id", () => {
  const { result } = renderHook(() => useSceneGridSelectionCursorMode());

  act(() => result.current.onMouseDown?.(mouseEvent(1, 2)));

  expect(mockDispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "editor/setScenePaintSelection",
      payload: expect.objectContaining({
        sceneId: "scene1",
        layerId: "layer1",
        mode: "tiles",
        selection: { x: 1, y: 2, width: 1, height: 1 },
      }),
    }),
  );
});

test("moving a tile selection dispatches moveSceneTileSelection", () => {
  mockEditor.scenePaintSelection = {
    sceneId: "scene1",
    layerId: "layer1",
    mode: "tiles",
    selection: { x: 0, y: 0, width: 1, height: 1 },
    offset: { x: 0, y: 0 },
  };
  const { result } = renderHook(() => useSceneGridSelectionCursorMode());

  act(() => result.current.onMouseDown?.(mouseEvent(0, 0)));
  act(() => result.current.onMouseMove?.(moveEvent(2, 1)));
  act(() => result.current.onMouseUp?.(moveEvent(2, 1)));

  expect(mockDispatch).toHaveBeenCalledWith({
    type: "entities/moveSceneTileSelection",
    payload: {
      sceneId: "scene1",
      layerId: "layer1",
      selection: { x: 0, y: 0, width: 1, height: 1 },
      offset: { x: 2, y: 1 },
    },
  });
});

test("cannot start a tile selection without a selected layer", () => {
  mockEditor.selectedTilemapLayerId = "";
  const { result } = renderHook(() => useSceneGridSelectionCursorMode());

  let handled = true;
  act(() => {
    handled = result.current.onMouseDown?.(mouseEvent(0, 0)) ?? false;
  });

  expect(handled).toBe(false);
  expect(mockDispatch).not.toHaveBeenCalledWith(
    expect.objectContaining({ type: "editor/setScenePaintSelection" }),
  );
});

test("changing selected tilemap layer clears the active tile selection", () => {
  mockEditor.scenePaintSelection = {
    sceneId: "scene1",
    layerId: "layer1",
    mode: "tiles",
    selection: { x: 0, y: 0, width: 1, height: 1 },
    offset: { x: 0, y: 0 },
  };
  const { rerender } = renderHook(() => useSceneGridSelectionCursorMode());
  mockDispatch.mockClear();

  mockEditor.selectedTilemapLayerId = "layer2";
  rerender();

  expect(mockDispatch).toHaveBeenCalledWith({
    type: "editor/setScenePaintSelection",
    payload: undefined,
  });
});
