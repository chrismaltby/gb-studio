import { compile } from "../../src/lib/events/eventSoundPlayEffect";

test("Should play beep with type beep and pitch 4 if not set", () => {
  const mockSoundPlayBeep = jest.fn();
  const mockWait = jest.fn();

  compile(
    {},
    {
      soundPlayBeep: mockSoundPlayBeep,
      wait: mockWait,
    }
  );
  expect(mockSoundPlayBeep).toBeCalledWith(5, 30, "medium");
});

test("Should be able to play beep with pitch 7 (really value 2 since flipped to make high values high pitched)", () => {
  const mockSoundPlayBeep = jest.fn();

  compile(
    {
      type: "beep",
      pitch: 7,
    },
    {
      soundPlayBeep: mockSoundPlayBeep,
    }
  );
  expect(mockSoundPlayBeep).toBeCalledWith(2, 30, "medium");
});

test("Should be able to play crash", () => {
  const mockSoundPlayCrash = jest.fn();

  compile(
    {
      type: "crash",
    },
    {
      soundPlayCrash: mockSoundPlayCrash,
    }
  );
  expect(mockSoundPlayCrash).toBeCalledWith(30, "medium");
});

test("Should play tone at 200hz for 0.5 seconds if tone not set", () => {
  const mockSoundStartTone = jest.fn();

  compile(
    {
      type: "tone",
    },
    {
      soundStartTone: mockSoundStartTone,
    }
  );
  expect(mockSoundStartTone).toBeCalledWith(1393, 30, "medium");
});

test("Should be able to play sound with tone 1024hz for 1 second", () => {
  const mockSoundStartTone = jest.fn();

  compile(
    {
      type: "tone",
      frequency: 1024,
      duration: 1.0,
    },
    {
      soundStartTone: mockSoundStartTone,
    }
  );
  expect(mockSoundStartTone).toBeCalledWith(1920, 60, "medium");
});

test("Should be able to wait for sound to finish", () => {
  const mockSoundStartTone = jest.fn();
  const mockWait = jest.fn();

  compile(
    {
      type: "tone",
      frequency: 1024,
      duration: 1.0,
      wait: true,
    },
    {
      soundStartTone: mockSoundStartTone,
      wait: mockWait,
    }
  );
  expect(mockSoundStartTone).toBeCalledWith(1920, 60, "medium");
  expect(mockWait).toBeCalledWith(60);
});
