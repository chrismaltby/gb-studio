import { applyDragOffset } from "components/world/entities/scenes/cursor/getDragOffset";

test("applies a tile-based grab offset", () => {
  expect(applyDragOffset(6, 4, 16, 8, 8)).toEqual({ x: 4, y: 3 });
});

test("ignores sub-tile grab offsets for tile-based entities", () => {
  expect(applyDragOffset(6, 4, 7, 7, 8)).toEqual({ x: 6, y: 4 });
});

test("applies an exact grab offset for pixel-positioned actors", () => {
  expect(applyDragOffset(20, 12, 5, 3, 1)).toEqual({ x: 15, y: 9 });
});
