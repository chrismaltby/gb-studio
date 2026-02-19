import { compile } from "../../src/lib/events/eventFadeIn";

test("Should be able to fade in", () => {
  const mockFadeIn = jest.fn();
  const mockIdle = jest.fn();

  compile(
    {
      speed: 2,
    },
    {
      fadeIn: mockFadeIn,
      idle: mockIdle,
    },
  );
  expect(mockIdle).toBeCalled();
  expect(mockFadeIn).toBeCalledWith(2);
});
