/** @jest-environment jsdom */

import { shouldShowSceneResizeHandles } from "components/world/entities/scenes/SceneView";
import { TOOL_COLORS, TOOL_COLLISIONS, TOOL_SELECT, TOOL_TILES } from "consts";

jest.mock("components/world/entities/scenes/SceneTileLayers", () => ({
  SceneTileLayers: () => null,
}));
jest.mock("components/world/entities/scenes/SceneEntities", () => ({
  SceneEntities: () => null,
}));

test.each([TOOL_COLLISIONS, TOOL_COLORS, TOOL_TILES])(
  "shows resize handles for the %s tool",
  (tool) => {
    expect(
      shouldShowSceneResizeHandles(true, true, true, "TOPDOWN", tool),
    ).toBe(true);
  },
);

test.each([
  [false, true, true, "TOPDOWN", TOOL_TILES],
  [true, false, true, "TOPDOWN", TOOL_TILES],
  [true, true, false, "TOPDOWN", TOOL_TILES],
  [true, true, true, "LOGO", TOOL_TILES],
  [true, true, true, "TOPDOWN", TOOL_SELECT],
])(
  "hides resize handles when a visibility condition is not met",
  (editable, selected, tilemap, sceneType, tool) => {
    expect(
      shouldShowSceneResizeHandles(
        editable,
        selected,
        tilemap,
        sceneType,
        tool,
      ),
    ).toBe(false);
  },
);
