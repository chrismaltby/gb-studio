/** @jest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import type {
  SceneCursorEvent,
  SceneCursorMouseDownRawEvent,
} from "components/world/entities/scenes/cursor/modes/SceneCursorMode";
import { useTilePaintCursorMode } from "components/world/entities/scenes/cursor/modes/useTilePaintCursorMode";
import { BRUSH_8PX, BRUSH_FILL, TOOL_TILES } from "consts";
import { dummySceneNormalized } from "../../../../../../dummydata";

const mockDispatch = jest.fn();
const mockEditor = {
  tool: TOOL_TILES,
  selectedBrush: BRUSH_8PX,
  selectedTilemapLayerId: "layer1",
  scenePaintEraser: false,
  selectedSceneTile: {
    tilesetId: "tileset1",
    tileIndex: 3,
    width: 1,
    height: 1,
    tilesetWidth: 8,
    autotile: false,
  },
};
const mockScene: typeof dummySceneNormalized & { tilemap?: any } = {
  ...dummySceneNormalized,
  id: "scene1",
  width: 8,
  height: 8,
  tilemap: {
    tilesets: [],
    tileColors: new Array(64).fill(0),
    layers: [
      {
        id: "layer1",
        name: "Layer 1",
        visible: true,
        tiles: new Array(64).fill(0),
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
  JigsawIcon: () => null,
}));

const mouseDownEvent = (
  x: number,
  y: number,
  shiftKey = false,
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
    shiftKey,
    nativeEvent: { which: 1 } as MouseEvent,
  },
});

const mouseMoveEvent = (x: number, y: number, shiftKey = false) => ({
  x,
  y,
  pX: x * 8,
  pY: y * 8,
  sceneId: "scene1",
  isOverScene: true,
  raw: { shiftKey } as MouseEvent,
});

const paintActions = () =>
  mockDispatch.mock.calls
    .map(([action]) => action)
    .filter((action) => action.type === "entities/paintSceneTile");

beforeEach(() => {
  jest.clearAllMocks();
  mockEditor.tool = TOOL_TILES;
  mockEditor.selectedBrush = BRUSH_8PX;
  mockEditor.selectedTilemapLayerId = "layer1";
  mockEditor.scenePaintEraser = false;
  mockEditor.selectedSceneTile = {
    tilesetId: "tileset1",
    tileIndex: 3,
    width: 1,
    height: 1,
    tilesetWidth: 8,
    autotile: false,
  };
  mockScene.tilemap = {
    tilesets: [],
    tileColors: new Array(64).fill(0),
    layers: [
      {
        id: "layer1",
        name: "Layer 1",
        visible: true,
        tiles: new Array(64).fill(0),
      },
    ],
  };
});

test("normal mouse down paints the selected tile", () => {
  const { result } = renderHook(() => useTilePaintCursorMode());

  act(() => result.current.onMouseDown?.(mouseDownEvent(2, 3)));

  expect(paintActions()).toEqual([
    expect.objectContaining({
      payload: expect.objectContaining({
        sceneId: "scene1",
        layerId: "layer1",
        tilesetId: "tileset1",
        tileIndex: 3,
        x: 2,
        y: 3,
        erase: false,
      }),
    }),
  ]);
});

test("hidden target layers alert and are not painted", () => {
  mockScene.tilemap.layers[0].visible = false;
  const alert = jest.spyOn(window, "alert").mockImplementation(() => undefined);
  const { result } = renderHook(() => useTilePaintCursorMode());

  act(() => result.current.onMouseDown?.(mouseDownEvent(1, 1)));

  expect(alert).toHaveBeenCalledWith("ERROR_SCENE_TARGET_LAYER_HIDDEN");
  expect(paintActions()).toHaveLength(0);
  alert.mockRestore();
});

test("non-tilemap scenes switch to select and select the scene", () => {
  mockScene.tilemap = undefined;
  const { result } = renderHook(() => useTilePaintCursorMode());

  act(() => result.current.onMouseDown?.(mouseDownEvent(0, 0)));

  expect(mockDispatch).toHaveBeenCalledWith({
    type: "editor/setTool",
    payload: { tool: "select" },
  });
  expect(mockDispatch).toHaveBeenCalledWith({
    type: "editor/selectScene",
    payload: { sceneId: "scene1" },
  });
  expect(paintActions()).toHaveLength(0);
});

test("shift-click paints a line from the previous draw position", () => {
  const { result } = renderHook(() => useTilePaintCursorMode());
  act(() => result.current.onMouseDown?.(mouseDownEvent(1, 2)));
  act(() => result.current.onMouseUp?.(mouseMoveEvent(1, 2)));
  mockDispatch.mockClear();

  act(() => result.current.onMouseDown?.(mouseDownEvent(5, 4, true)));

  expect(paintActions()[0]?.payload).toEqual(
    expect.objectContaining({
      x: 1,
      y: 2,
      endX: 5,
      endY: 4,
      drawLine: true,
    }),
  );
});

test("stamp dragging advances line starts by stamp dimensions", () => {
  mockEditor.selectedSceneTile = {
    ...mockEditor.selectedSceneTile,
    width: 2,
    height: 2,
  };
  const { result } = renderHook(() => useTilePaintCursorMode());
  act(() => result.current.onMouseDown?.(mouseDownEvent(0, 0)));
  act(() => result.current.onMouseMove?.(mouseMoveEvent(5, 0)));
  act(() => result.current.onMouseMove?.(mouseMoveEvent(7, 0)));

  expect(paintActions().map((action) => action.payload)).toEqual([
    expect.objectContaining({ x: 0, y: 0 }),
    expect.objectContaining({ x: 0, y: 0, endX: 5, endY: 0 }),
    expect.objectContaining({ x: 4, y: 0, endX: 7, endY: 0 }),
  ]);
});

test("fill is a one-shot paint operation", () => {
  mockEditor.selectedBrush = BRUSH_FILL;
  const { result } = renderHook(() => useTilePaintCursorMode());
  act(() => result.current.onMouseDown?.(mouseDownEvent(0, 0)));
  act(() => result.current.onMouseMove?.(mouseMoveEvent(4, 0)));

  expect(paintActions()).toHaveLength(1);
});
