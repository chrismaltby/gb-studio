import { compile } from "../../src/lib/events/eventMusicPlay";

test("Should be able to play music", () => {
  const mockMusicPlay = jest.fn();

  compile(
    {
      musicId: "1",
      loop: false
    },
    {
      musicPlay: mockMusicPlay
    }
  );
  expect(mockMusicPlay).toBeCalledWith("1", false);
});

test("Should be able to loop music", () => {
  const mockMusicPlay = jest.fn();

  compile(
    {
      musicId: "1",
      loop: true
    },
    {
      musicPlay: mockMusicPlay
    }
  );
  expect(mockMusicPlay).toBeCalledWith("1", true);
});
