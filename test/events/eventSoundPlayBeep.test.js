import { compile } from "../../src/lib/events/eventSoundPlayBeep";

test("Should play beep with pitch 4 if not set", () => {
  const mockSoundPlayBeep = jest.fn();

  compile(
    {},
    {
      soundPlayBeep: mockSoundPlayBeep
    }
  );
  expect(mockSoundPlayBeep).toBeCalledWith(4);
});


test("Should be able to play beep with pitch 7", () => {
  const mockSoundPlayBeep = jest.fn();

  compile(
    {
      pitch: 7
    },
    {
      soundPlayBeep: mockSoundPlayBeep
    }
  );
  expect(mockSoundPlayBeep).toBeCalledWith(7);
});
