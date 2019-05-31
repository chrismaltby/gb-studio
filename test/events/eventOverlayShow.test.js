import { compile } from "../../src/lib/events/eventOverlayShow";

test("Should set show overlay at position", () => {
  const mockOverlayShow = jest.fn();

  compile(
    {
      color: "white",
      x: 5,
      y: 9
    },
    {
      overlayShow: mockOverlayShow
    }
  );
  expect(mockOverlayShow).toBeCalledWith("white", 5, 9);
});
