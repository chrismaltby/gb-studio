import {
  resetPaintInteractionForScene,
  shouldPaintCollisionBrush,
} from "components/world/entities/scenes/cursor/modes/paintCursorHelpers";

describe("resetPaintInteractionForScene", () => {
  test("preserves a paint anchor within the same scene", () => {
    const state = {
      sceneId: "scene1",
      startX: 2,
      startY: 3,
      currentX: 4,
      currentY: 5,
      lockX: true,
    };

    resetPaintInteractionForScene(state, "scene1");

    expect(state).toEqual({
      sceneId: "scene1",
      startX: 2,
      startY: 3,
      currentX: 4,
      currentY: 5,
      lockX: true,
    });
  });

  test("clears a paint anchor when entering another scene", () => {
    const state = {
      sceneId: "scene1",
      startX: 2,
      startY: 3,
      currentX: 4,
      currentY: 5,
      lockX: true,
      lockY: true,
    };

    resetPaintInteractionForScene(state, "scene2");

    expect(state).toEqual({
      sceneId: "scene2",
      startX: undefined,
      startY: undefined,
      currentX: undefined,
      currentY: undefined,
      lockX: undefined,
      lockY: undefined,
    });
  });
});

describe("shouldPaintCollisionBrush", () => {
  test("paints a mixed collision brush when any tile differs", () => {
    expect(
      shouldPaintCollisionBrush([1, 1, 1, 0], 2, 2, 0, 0, 2, 1, 0xff),
    ).toBe(true);
  });

  test("erases a collision brush when every tile matches", () => {
    expect(
      shouldPaintCollisionBrush([1, 1, 1, 1], 2, 2, 0, 0, 2, 1, 0xff),
    ).toBe(false);
  });

  test("does not wrap an edge brush into the next row", () => {
    expect(
      shouldPaintCollisionBrush([0, 0, 1, 0, 0, 1], 3, 2, 2, 0, 2, 1, 0xff),
    ).toBe(false);
  });
});
