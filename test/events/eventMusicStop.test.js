import { compile } from "../../src/lib/events/eventMusicStop";

test("Should be able to stop music", () => {
  const mockStopMusic = jest.fn();

  compile(
    {},
    {
      stopMusic: mockStopMusic
    }
  );
  expect(mockStopMusic).toBeCalledWith();
});
