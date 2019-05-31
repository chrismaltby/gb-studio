import { compile } from "../../src/lib/events/eventSpritesHide";

test("Should be able to hide sprites", () => {
  const mockSpritesHide = jest.fn();

  compile(
    {},
    {
      spritesHide: mockSpritesHide
    }
  );
  expect(mockSpritesHide).toBeCalled();
});
