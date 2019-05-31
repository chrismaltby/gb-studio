import { compile } from "../../src/lib/events/eventPlayerSetSprite";

test("Should be able to set player sprite sheet", () => {
  const mockPlayerSetSprite = jest.fn();
  compile(
    {
      spriteSheetId: "abc"
    },
    {
      playerSetSprite: mockPlayerSetSprite
    }
  );
  expect(mockPlayerSetSprite).toBeCalledWith("abc");
});
