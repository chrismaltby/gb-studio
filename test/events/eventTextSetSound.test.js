import { compile } from "../../src/lib/events/eventTextSetSound";

test("Should remove text sound if not set", () => {
  const mockTextRemoveSound = jest.fn();

  compile(
    {},
    {
      textRemoveSound: mockTextRemoveSound,
    }
  );
  expect(mockTextRemoveSound).toHaveBeenCalled();
});

test("Should remove text sound if set to none", () => {
  const mockTextRemoveSound = jest.fn();

  compile(
    {
      type: "none",
    },
    {
      textRemoveSound: mockTextRemoveSound,
    }
  );
  expect(mockTextRemoveSound).toHaveBeenCalled();
});

test("Should be able to set text sound to beep with pitch 7 (really value 2 since flipped to make high values high pitched)", () => {
  const mockTextSetSoundBeep = jest.fn();

  compile(
    {
      type: "beep",
      pitch: 7,
    },
    {
      textSetSoundBeep: mockTextSetSoundBeep,
    }
  );
  expect(mockTextSetSoundBeep).toHaveBeenCalledWith(2, 30);
});

test("Should be able to set text sound to crash", () => {
  const mockTextSetSoundCrash = jest.fn();

  compile(
    {
      type: "crash",
    },
    {
      textSetSoundCrash: mockTextSetSoundCrash,
    }
  );
  expect(mockTextSetSoundCrash).toHaveBeenCalledWith(30);
});

test("Should set text sound to tone at 200hz for 0.5 seconds if tone not set", () => {
  const mockTextSetSoundTone = jest.fn();

  compile(
    {
      type: "tone",
    },
    {
      textSetSoundTone: mockTextSetSoundTone,
    }
  );
  expect(mockTextSetSoundTone).toHaveBeenCalledWith(1393, 30);
});

test("Should be able to set text sound to tone 1024hz for 1 second", () => {
  const mockTextSetSoundTone = jest.fn();

  compile(
    {
      type: "tone",
      frequency: 1024,
      duration: 1.0,
    },
    {
      textSetSoundTone: mockTextSetSoundTone,
    }
  );
  expect(mockTextSetSoundTone).toHaveBeenCalledWith(1920, 60);
});
