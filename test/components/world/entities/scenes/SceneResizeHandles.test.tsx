/** @jest-environment jsdom */

import React from "react";
import { fireEvent, render, screen } from "../../../../react-utils";
import SceneResizeHandles, {
  resizeGeometry,
  type ResizeStart,
} from "components/world/entities/scenes/SceneResizeHandles";
import { MAX_SCENE_TILE_COUNT } from "consts";

const mockDispatch = jest.fn();

jest.mock("store/hooks", () => ({
  useAppDispatch: () => mockDispatch,
}));

const start = (
  edge: ResizeStart["edge"],
  overrides: Partial<ResizeStart> = {},
): ResizeStart => ({
  edge,
  pageX: 100,
  pageY: 100,
  x: 80,
  y: 40,
  width: 30,
  height: 20,
  shiftX: 0,
  shiftY: 0,
  preview: {
    x: 80,
    y: 40,
    width: 30,
    height: 20,
    shiftX: 0,
    shiftY: 0,
  },
  ...overrides,
});

test.each([
  [
    "right",
    116,
    100,
    { x: 80, y: 40, width: 32, height: 20, shiftX: 0, shiftY: 0 },
  ],
  [
    "left",
    116,
    100,
    { x: 96, y: 40, width: 28, height: 20, shiftX: -2, shiftY: 0 },
  ],
  [
    "bottom",
    100,
    116,
    { x: 80, y: 40, width: 30, height: 22, shiftX: 0, shiftY: 0 },
  ],
  [
    "top",
    100,
    116,
    { x: 80, y: 56, width: 30, height: 18, shiftX: 0, shiftY: -2 },
  ],
] as const)("calculates %s resize geometry", (edge, pageX, pageY, expected) => {
  expect(resizeGeometry(start(edge), pageX, pageY, 1)).toEqual(expected);
});

test("accounts for zoom when calculating tile deltas", () => {
  expect(resizeGeometry(start("right"), 116, 100, 2).width).toBe(31);
});

test("clamps resize geometry to minimum dimensions", () => {
  expect(resizeGeometry(start("left"), 1000, 100, 1)).toEqual(
    expect.objectContaining({ width: 20, x: 160, shiftX: -10 }),
  );
  expect(resizeGeometry(start("top"), 100, 1000, 1)).toEqual(
    expect.objectContaining({ height: 18, y: 56, shiftY: -2 }),
  );
});

test("clamps width and height to MAX_SCENE_TILE_COUNT", () => {
  const widthResult = resizeGeometry(
    start("right", { width: 20, height: 78 }),
    10000,
    100,
    1,
  );
  const heightResult = resizeGeometry(
    start("bottom", { width: 208, height: 18 }),
    100,
    10000,
    1,
  );

  expect(widthResult.width * widthResult.height).toBeLessThanOrEqual(
    MAX_SCENE_TILE_COUNT,
  );
  expect(widthResult.width).toBe(Math.floor(MAX_SCENE_TILE_COUNT / 78));
  expect(heightResult.width * heightResult.height).toBeLessThanOrEqual(
    MAX_SCENE_TILE_COUNT,
  );
  expect(heightResult.height).toBe(Math.floor(MAX_SCENE_TILE_COUNT / 208));
});

test("shows a preview and dispatches the completed resize", () => {
  const { container } = render(
    <SceneResizeHandles
      sceneId="scene1"
      x={80}
      y={40}
      width={30}
      height={20}
      zoomRatio={1}
    />,
  );

  const mouseEvent = (type: string, pageX: number, pageY: number) => {
    const event = new MouseEvent(type, { bubbles: true });
    Object.defineProperties(event, {
      pageX: { value: pageX },
      pageY: { value: pageY },
    });
    return event;
  };

  fireEvent(
    screen.getByTestId("scene-resize-left"),
    mouseEvent("mousedown", 100, 100),
  );
  fireEvent(window, mouseEvent("mousemove", 116, 100));

  expect(container.querySelector('[style*="width: 224px"]')).not.toBeNull();

  fireEvent(window, mouseEvent("mouseup", 116, 100));

  expect(mockDispatch).toHaveBeenCalledWith({
    type: "entities/resizeTilemapLayers",
    payload: {
      sceneId: "scene1",
      x: 96,
      y: 40,
      width: 28,
      height: 20,
      shiftX: -2,
      shiftY: 0,
      resizeAxis: "width",
    },
  });
});
