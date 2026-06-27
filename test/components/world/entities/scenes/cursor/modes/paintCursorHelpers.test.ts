import { shouldPaintCollisionBrush } from "components/world/entities/scenes/cursor/modes/paintCursorHelpers";

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
