import { compile } from "../../src/lib/events/eventFadeOut";

test("Should be able to fade out", () => {
  const mockFadeOut = jest.fn();

  compile(
    {
      speed: 2
    },
    {
      fadeOut: mockFadeOut
    }
  );
  expect(mockFadeOut).toBeCalledWith(2);
});
