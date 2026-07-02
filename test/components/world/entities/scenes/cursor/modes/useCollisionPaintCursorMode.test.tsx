/** @jest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { useCollisionPaintCursorMode } from "components/world/entities/scenes/cursor/modes/useCollisionPaintCursorMode";
import type {
  SceneCursorEvent,
  SceneCursorMouseDownRawEvent,
} from "components/world/entities/scenes/cursor/modes/SceneCursorMode";
import { BRUSH_8PX, TOOL_COLLISIONS } from "consts";
import { dummySceneNormalized } from "../../../../../../dummydata";

const mockDispatch = jest.fn();
const mockEditor = {
  tool: TOOL_COLLISIONS,
  selectedBrush: BRUSH_8PX,
  selectedTileType: 1,
  selectedTileMask: 0x0f,
  scenePaintEraser: false,
};
const mockScene = {
  ...dummySceneNormalized,
  id: "scene1",
  width: 2,
  height: 2,
  collisions: [0, 0, 0, 0],
};
const mockState = {
  editor: mockEditor,
  assets: { backgrounds: {} },
};
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
  BrickIcon: () => null,
}));

const mouseDownEvent = (): SceneCursorEvent<SceneCursorMouseDownRawEvent> => ({
  x: 0,
  y: 0,
  pX: 0,
  pY: 0,
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

const paintAction = () =>
  mockDispatch.mock.calls
    .map(([action]) => action)
    .find((action) => action.type === "entities/paintCollision");

beforeEach(() => {
  jest.clearAllMocks();
  mockEditor.scenePaintEraser = false;
  mockEditor.selectedTileMask = 0x0f;
  mockScene.collisions = [0, 0, 0, 0];
});

test("collision eraser paints zero even when the brush would normally paint", () => {
  mockEditor.scenePaintEraser = true;
  const { result } = renderHook(() =>
    useCollisionPaintCursorMode(() => undefined),
  );

  act(() => result.current.onMouseDown?.(mouseDownEvent()));

  expect(paintAction()?.payload.value).toBe(0);
});

test("collision eraser uses the full mask", () => {
  mockEditor.scenePaintEraser = true;
  mockEditor.selectedTileMask = 0x03;
  const { result } = renderHook(() =>
    useCollisionPaintCursorMode(() => undefined),
  );

  act(() => result.current.onMouseDown?.(mouseDownEvent()));

  expect(paintAction()?.payload.mask).toBe(0xff);
});

test("normal collision paint behavior remains unchanged", () => {
  const { result } = renderHook(() =>
    useCollisionPaintCursorMode(() => undefined),
  );

  act(() => result.current.onMouseDown?.(mouseDownEvent()));
  expect(paintAction()?.payload).toEqual(
    expect.objectContaining({ value: 1, mask: 0x0f }),
  );

  mockDispatch.mockClear();
  mockScene.collisions = [1, 0, 0, 0];
  act(() => result.current.onMouseDown?.(mouseDownEvent()));
  expect(paintAction()?.payload).toEqual(
    expect.objectContaining({ value: 0, mask: 0x0f }),
  );
});
