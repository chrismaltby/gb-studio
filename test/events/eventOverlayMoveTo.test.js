import { compile } from "../../src/lib/events/eventOverlayMoveTo";

test("Should set move overlay to position", () => {
  const mockOverlayMoveTo = jest.fn();

  compile(
    {
      x: 5,
      y: 9,
      speed: 1,
      wait: true,
    },
    {
      overlayMoveTo: mockOverlayMoveTo,
    },
  );
  expect(mockOverlayMoveTo).toBeCalledWith(5, 9, 1, true);
});

test("Should set move overlay to position with instant speed", () => {
  const mockOverlayMoveTo = jest.fn();

  compile(
    {
      x: 5,
      y: 9,
      speed: -3,
      wait: false,
    },
    {
      overlayMoveTo: mockOverlayMoveTo,
    },
  );
  expect(mockOverlayMoveTo).toBeCalledWith(5, 9, -3, false);
});

test("Should set wait to true by default for legacy events", () => {
  const mockOverlayMoveTo = jest.fn();

  compile(
    {
      x: 5,
      y: 9,
      speed: 1,
    },
    {
      overlayMoveTo: mockOverlayMoveTo,
    },
  );
  expect(mockOverlayMoveTo).toBeCalledWith(5, 9, 1, true);
});
