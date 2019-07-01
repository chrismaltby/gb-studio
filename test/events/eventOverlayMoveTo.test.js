import { compile } from "../../src/lib/events/eventOverlayMoveTo";

test("Should set move overlay to position", () => {
  const mockOverlayMoveTo = jest.fn();

  compile(
    {
      x: 5,
      y: 9,
      speed: 2
    },
    {
      overlayMoveTo: mockOverlayMoveTo
    }
  );
  expect(mockOverlayMoveTo).toBeCalledWith(5, 9, 2);
});
