import { compile } from "../../src/lib/events/eventOverlayHide";

test("Should be able to hide overlay", () => {
  const mockOverlayHide = jest.fn();

  compile(
    {},
    {
      overlayHide: mockOverlayHide
    }
  );
  expect(mockOverlayHide).toBeCalled();
});
