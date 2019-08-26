import { compile } from "../../src/lib/events/eventSoundPlayBeep";

test("Should play beep sound with tone 1024 if tone not set", () => {
  const mockSoundPlayBeep = jest.fn();

  compile(
    {},
    {
      soundPlayBeep: mockSoundPlayBeep
    }
  );
  expect(mockSoundPlayBeep).toBeCalledWith(1024);
});


test("Should be able to play beep sound with tone 1000", () => {
  const mockSoundPlayBeep = jest.fn();

  compile(
    {
      tone: 1000
    },
    {
      soundPlayBeep: mockSoundPlayBeep
    }
  );
  expect(mockSoundPlayBeep).toBeCalledWith(1000);
});
