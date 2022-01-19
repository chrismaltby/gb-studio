import { compile } from "../../src/lib/events/eventFadeIn";

test("Should be able to fade in", () => {
  const mockFadeIn = jest.fn();

  compile(
    {
      speed: 2
    },
    {
      fadeIn: mockFadeIn
    }
  );
  expect(mockFadeIn).toBeCalledWith(2);
});
