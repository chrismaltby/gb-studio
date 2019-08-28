import { compile } from "../../src/lib/events/eventSoundPlayTone";

test("Should play tone at 200hz for 0.5 seconds if tone not set", () => {
  const mockSoundPlayTone = jest.fn();

  compile(
    {},
    {
      soundPlayTone: mockSoundPlayTone
    }
  );
  expect(mockSoundPlayTone).toBeCalledWith(200, 0.5);
});


test("Should be able to play sound with tone 400hz for 1 second", () => {
  const mockSoundPlayTone = jest.fn();

  compile(
    {
      tone: 400,
      duration: 1.0
    },
    {
      soundPlayTone: mockSoundPlayTone
    }
  );
  expect(mockSoundPlayTone).toBeCalledWith(400, 1);
});
