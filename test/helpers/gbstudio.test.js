import {
  directionToFrame,
  spriteTypeFromNumFrames
} from "../../src/lib/helpers/gbstudio";

test("Should be able to find sprite type from number of frames in sprite", () => {
  expect(spriteTypeFromNumFrames(6)).toBe("actor_animated");
  expect(spriteTypeFromNumFrames(3)).toBe("actor");
  expect(spriteTypeFromNumFrames(1)).toBe("static");
  expect(spriteTypeFromNumFrames(2)).toBe("animated");
  expect(spriteTypeFromNumFrames(4)).toBe("animated");
  expect(spriteTypeFromNumFrames(7)).toBe("animated");
});

test("Should be able to calculate frame offset from direction for actors", () => {
  expect(directionToFrame("down", 3)).toBe(0);
  expect(directionToFrame("up", 3)).toBe(1);
  expect(directionToFrame("left", 3)).toBe(2);
  expect(directionToFrame("right", 3)).toBe(2);
});

test("Should be able to calculate frame offset from direction for animated actors", () => {
  expect(directionToFrame("down", 6)).toBe(0);
  expect(directionToFrame("up", 6)).toBe(2);
  expect(directionToFrame("left", 6)).toBe(4);
  expect(directionToFrame("right", 6)).toBe(4);
});

test("Should always have no frame offset if not actor", () => {
  expect(directionToFrame("down", 5)).toBe(0);
  expect(directionToFrame("up", 5)).toBe(0);
  expect(directionToFrame("left", 5)).toBe(0);
  expect(directionToFrame("right", 5)).toBe(0);
});
