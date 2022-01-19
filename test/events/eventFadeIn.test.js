import { compile } from "../../src/lib/events/eventFadeIn";

test("Should be able to fade in", () => {
  const mockFadeIn = jest.fn();
  const mockNextFrameAwait = jest.fn();

  compile(
    {
      speed: 2,
    },
    {
      fadeIn: mockFadeIn,
      nextFrameAwait: mockNextFrameAwait,
    }
  );
  expect(mockNextFrameAwait).toBeCalled();
  expect(mockFadeIn).toBeCalledWith(2);
});
