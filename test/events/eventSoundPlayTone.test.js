import { compile } from "../../src/lib/events/eventSoundPlayTone";

test("Should play sound with tone 1024 if tone not set", () => {
  const mockSoundPlayTone = jest.fn();

  compile(
    {},
    {
      soundPlayTone: mockSoundPlayTone
    }
  );
  expect(mockSoundPlayTone).toBeCalledWith(1024);
});


test("Should be able to play sound with tone 1000", () => {
  const mockSoundPlayTone = jest.fn();

  compile(
    {
      tone: 1000
    },
    {
      soundPlayTone: mockSoundPlayTone
    }
  );
  expect(mockSoundPlayTone).toBeCalledWith(1000);
});
