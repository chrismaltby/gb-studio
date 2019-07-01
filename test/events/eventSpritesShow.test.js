import { compile } from "../../src/lib/events/eventSpritesShow";

test("Should be able to show sprites", () => {
  const mockSpritesShow = jest.fn();

  compile(
    {},
    {
      spritesShow: mockSpritesShow
    }
  );
  expect(mockSpritesShow).toBeCalled();
});
