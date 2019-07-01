import { compile } from "../../src/lib/events/eventMusicStop";

test("Should be able to stop music", () => {
  const mockMusicStop = jest.fn();

  compile(
    {},
    {
      musicStop: mockMusicStop
    }
  );
  expect(mockMusicStop).toBeCalledWith();
});
