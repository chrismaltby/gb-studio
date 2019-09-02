import { compile } from "../../src/lib/events/eventSoundPlayTone";

test("Should play tone at 200hz for 0.5 seconds if tone not set", () => {
  const mockSoundStartTone = jest.fn();
  const mockWait = jest.fn();
  const mockSoundStopTone = jest.fn();

  compile(
    {},
    {
      soundStartTone: mockSoundStartTone,
      wait: mockWait,
      soundStopTone: mockSoundStopTone
    }
  );
  expect(mockSoundStartTone).toBeCalledWith(1393);
  expect(mockWait).toBeCalledWith(30);
  expect(mockSoundStopTone).toBeCalledWith();
});


test("Should be able to play sound with tone 1024hz for 1 second", () => {
  const mockSoundStartTone = jest.fn();
  const mockWait = jest.fn();
  const mockSoundStopTone = jest.fn();

  compile(
    {
      tone: 1024,
      duration: 1.0
    },
    {
      soundStartTone: mockSoundStartTone,
      wait: mockWait,
      soundStopTone: mockSoundStopTone
    }
  );
  expect(mockSoundStartTone).toBeCalledWith(1920);
  expect(mockWait).toBeCalledWith(60);
  expect(mockSoundStopTone).toBeCalledWith();
});
