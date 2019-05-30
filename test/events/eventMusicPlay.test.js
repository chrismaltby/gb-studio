import { compile } from "../../src/lib/events/eventMusicPlay";

test("Should be able to play music", () => {
  const mockPlayMusic = jest.fn();

  compile(
    {
      musicId: "1",
      loop: false
    },
    {
      playMusic: mockPlayMusic
    }
  );
  expect(mockPlayMusic).toBeCalledWith("1", false);
});

test("Should be able to loop music", () => {
  const mockPlayMusic = jest.fn();

  compile(
    {
      musicId: "1",
      loop: true
    },
    {
      playMusic: mockPlayMusic
    }
  );
  expect(mockPlayMusic).toBeCalledWith("1", true);
});
