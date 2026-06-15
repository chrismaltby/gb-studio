import { createSubPattern } from "shared/lib/uge/song";
import {
  UGI_INSTRUMENT_SIZE,
  loadUGIInstrument,
  saveUGIInstrument,
  isDutyInstrument,
  isWaveInstrument,
  isNoiseInstrument,
} from "shared/lib/uge/ugiHelper";
import type {
  DutyInstrument,
  NoiseInstrument,
  WaveInstrument,
} from "shared/lib/uge/types";

const makeDutyInstrument = (
  overrides?: Partial<DutyInstrument>,
): DutyInstrument => ({
  index: 0,
  name: "Test Duty",
  length: 16,
  dutyCycle: 2,
  initialVolume: 12,
  volumeSweepChange: -3,
  frequencySweepTime: 4,
  frequencySweepShift: -2,
  subpatternEnabled: false,
  subpattern: createSubPattern(),
  ...overrides,
});

const makeWaveInstrument = (
  overrides?: Partial<WaveInstrument>,
): WaveInstrument => ({
  index: 0,
  name: "Test Wave",
  length: 32,
  volume: 2,
  waveIndex: 5,
  subpatternEnabled: true,
  subpattern: createSubPattern(),
  ...overrides,
});

const makeNoiseInstrument = (
  overrides?: Partial<NoiseInstrument>,
): NoiseInstrument => ({
  index: 0,
  name: "Test Noise",
  length: null,
  initialVolume: 8,
  volumeSweepChange: 2,
  bitCount: 7,
  subpatternEnabled: false,
  subpattern: createSubPattern(),
  ...overrides,
});

describe("saveUGIInstrument / loadUGIInstrument", () => {
  describe("buffer size", () => {
    test("saved duty instrument is exactly UGI_INSTRUMENT_SIZE bytes", () => {
      const buf = saveUGIInstrument(makeDutyInstrument());
      expect(buf.byteLength).toBe(UGI_INSTRUMENT_SIZE);
    });

    test("saved wave instrument is exactly UGI_INSTRUMENT_SIZE bytes", () => {
      const buf = saveUGIInstrument(makeWaveInstrument());
      expect(buf.byteLength).toBe(UGI_INSTRUMENT_SIZE);
    });

    test("saved noise instrument is exactly UGI_INSTRUMENT_SIZE bytes", () => {
      const buf = saveUGIInstrument(makeNoiseInstrument());
      expect(buf.byteLength).toBe(UGI_INSTRUMENT_SIZE);
    });
  });

  describe("type detection after round-trip", () => {
    test("duty instrument round-trips as DutyInstrument", () => {
      const loaded = loadUGIInstrument(saveUGIInstrument(makeDutyInstrument()));
      expect(isDutyInstrument(loaded)).toBe(true);
    });

    test("wave instrument round-trips as WaveInstrument", () => {
      const loaded = loadUGIInstrument(saveUGIInstrument(makeWaveInstrument()));
      expect(isWaveInstrument(loaded)).toBe(true);
    });

    test("noise instrument round-trips as NoiseInstrument", () => {
      const loaded = loadUGIInstrument(
        saveUGIInstrument(makeNoiseInstrument()),
      );
      expect(isNoiseInstrument(loaded)).toBe(true);
    });
  });

  describe("duty instrument round-trip", () => {
    test("name is preserved", () => {
      const instr = makeDutyInstrument({ name: "My Lead" });
      const loaded = loadUGIInstrument(saveUGIInstrument(instr));
      expect(loaded.name).toBe("My Lead");
    });

    test("length is preserved", () => {
      const instr = makeDutyInstrument({ length: 20 });
      const loaded = loadUGIInstrument(
        saveUGIInstrument(instr),
      ) as DutyInstrument;
      expect(loaded.length).toBe(20);
    });

    test("null length is preserved", () => {
      const instr = makeDutyInstrument({ length: null });
      const loaded = loadUGIInstrument(
        saveUGIInstrument(instr),
      ) as DutyInstrument;
      expect(loaded.length).toBeNull();
    });

    test("dutyCycle is preserved", () => {
      const instr = makeDutyInstrument({ dutyCycle: 3 });
      const loaded = loadUGIInstrument(
        saveUGIInstrument(instr),
      ) as DutyInstrument;
      expect(loaded.dutyCycle).toBe(3);
    });

    test("initialVolume is preserved", () => {
      const instr = makeDutyInstrument({ initialVolume: 10 });
      const loaded = loadUGIInstrument(
        saveUGIInstrument(instr),
      ) as DutyInstrument;
      expect(loaded.initialVolume).toBe(10);
    });

    test("negative volumeSweepChange (decreasing envelope) is preserved", () => {
      const instr = makeDutyInstrument({ volumeSweepChange: -3 });
      const loaded = loadUGIInstrument(
        saveUGIInstrument(instr),
      ) as DutyInstrument;
      expect(loaded.volumeSweepChange).toBe(-3);
    });

    test("positive volumeSweepChange (increasing envelope) is preserved", () => {
      const instr = makeDutyInstrument({ volumeSweepChange: 4 });
      const loaded = loadUGIInstrument(
        saveUGIInstrument(instr),
      ) as DutyInstrument;
      expect(loaded.volumeSweepChange).toBe(4);
    });

    test("zero volumeSweepChange is preserved", () => {
      const instr = makeDutyInstrument({ volumeSweepChange: 0 });
      const loaded = loadUGIInstrument(
        saveUGIInstrument(instr),
      ) as DutyInstrument;
      expect(loaded.volumeSweepChange).toBe(0);
    });

    test("positive frequencySweepShift is preserved", () => {
      const instr = makeDutyInstrument({ frequencySweepShift: 3 });
      const loaded = loadUGIInstrument(
        saveUGIInstrument(instr),
      ) as DutyInstrument;
      expect(loaded.frequencySweepShift).toBe(3);
    });

    test("negative frequencySweepShift is preserved", () => {
      const instr = makeDutyInstrument({ frequencySweepShift: -2 });
      const loaded = loadUGIInstrument(
        saveUGIInstrument(instr),
      ) as DutyInstrument;
      expect(loaded.frequencySweepShift).toBe(-2);
    });

    test("frequencySweepTime is preserved", () => {
      const instr = makeDutyInstrument({ frequencySweepTime: 5 });
      const loaded = loadUGIInstrument(
        saveUGIInstrument(instr),
      ) as DutyInstrument;
      expect(loaded.frequencySweepTime).toBe(5);
    });
  });

  describe("wave instrument round-trip", () => {
    test("name is preserved", () => {
      const instr = makeWaveInstrument({ name: "Bass Wave" });
      const loaded = loadUGIInstrument(saveUGIInstrument(instr));
      expect(loaded.name).toBe("Bass Wave");
    });

    test("null length is preserved", () => {
      const instr = makeWaveInstrument({ length: null });
      const loaded = loadUGIInstrument(
        saveUGIInstrument(instr),
      ) as WaveInstrument;
      expect(loaded.length).toBeNull();
    });

    test("length is preserved", () => {
      const instr = makeWaveInstrument({ length: 100 });
      const loaded = loadUGIInstrument(
        saveUGIInstrument(instr),
      ) as WaveInstrument;
      expect(loaded.length).toBe(100);
    });

    test("volume is preserved", () => {
      const instr = makeWaveInstrument({ volume: 3 });
      const loaded = loadUGIInstrument(
        saveUGIInstrument(instr),
      ) as WaveInstrument;
      expect(loaded.volume).toBe(3);
    });

    test("waveIndex is preserved", () => {
      const instr = makeWaveInstrument({ waveIndex: 11 });
      const loaded = loadUGIInstrument(
        saveUGIInstrument(instr),
      ) as WaveInstrument;
      expect(loaded.waveIndex).toBe(11);
    });
  });

  describe("noise instrument round-trip", () => {
    test("name is preserved", () => {
      const instr = makeNoiseInstrument({ name: "Snare" });
      const loaded = loadUGIInstrument(saveUGIInstrument(instr));
      expect(loaded.name).toBe("Snare");
    });

    test("bitCount 7 (7-step) is preserved", () => {
      const instr = makeNoiseInstrument({ bitCount: 7 });
      const loaded = loadUGIInstrument(
        saveUGIInstrument(instr),
      ) as NoiseInstrument;
      expect(loaded.bitCount).toBe(7);
    });

    test("bitCount 15 (15-step) is preserved", () => {
      const instr = makeNoiseInstrument({ bitCount: 15 });
      const loaded = loadUGIInstrument(
        saveUGIInstrument(instr),
      ) as NoiseInstrument;
      expect(loaded.bitCount).toBe(15);
    });

    test("initialVolume is preserved", () => {
      const instr = makeNoiseInstrument({ initialVolume: 6 });
      const loaded = loadUGIInstrument(
        saveUGIInstrument(instr),
      ) as NoiseInstrument;
      expect(loaded.initialVolume).toBe(6);
    });

    test("volumeSweepChange is preserved", () => {
      const instr = makeNoiseInstrument({ volumeSweepChange: -5 });
      const loaded = loadUGIInstrument(
        saveUGIInstrument(instr),
      ) as NoiseInstrument;
      expect(loaded.volumeSweepChange).toBe(-5);
    });

    test("null length is preserved", () => {
      const instr = makeNoiseInstrument({ length: null });
      const loaded = loadUGIInstrument(
        saveUGIInstrument(instr),
      ) as NoiseInstrument;
      expect(loaded.length).toBeNull();
    });
  });

  describe("subpattern round-trip", () => {
    test("subpatternEnabled=true is preserved", () => {
      const instr = makeDutyInstrument({ subpatternEnabled: true });
      const loaded = loadUGIInstrument(saveUGIInstrument(instr));
      expect(loaded.subpatternEnabled).toBe(true);
    });

    test("subpatternEnabled=false is preserved", () => {
      const instr = makeDutyInstrument({ subpatternEnabled: false });
      const loaded = loadUGIInstrument(saveUGIInstrument(instr));
      expect(loaded.subpatternEnabled).toBe(false);
    });

    test("non-trivial subpattern cells survive round-trip", () => {
      const subpattern = createSubPattern();
      subpattern[0] = { note: 36, jump: 3, effectCode: 5, effectParam: 10 };
      subpattern[1] = {
        note: 48,
        jump: null,
        effectCode: null,
        effectParam: null,
      };
      subpattern[63] = {
        note: null,
        jump: 1,
        effectCode: 0x0a,
        effectParam: 0xff,
      };

      const instr = makeDutyInstrument({
        subpatternEnabled: true,
        subpattern,
      });
      const loaded = loadUGIInstrument(saveUGIInstrument(instr));

      expect(loaded.subpattern[0]?.note).toBe(36);
      expect(loaded.subpattern[0]?.jump).toBe(3);
      expect(loaded.subpattern[0]?.effectCode).toBe(5);
      expect(loaded.subpattern[0]?.effectParam).toBe(10);

      expect(loaded.subpattern[1]?.note).toBe(48);
      expect(loaded.subpattern[1]?.jump).toBe(0); // null jump serializes as 0
      expect(loaded.subpattern[1]?.effectCode).toBeNull();
      expect(loaded.subpattern[1]?.effectParam).toBeNull();

      expect(loaded.subpattern[63]?.note).toBeNull();
      expect(loaded.subpattern[63]?.jump).toBe(1);
      expect(loaded.subpattern[63]?.effectCode).toBe(0x0a);
      expect(loaded.subpattern[63]?.effectParam).toBe(0xff);
    });

    test("subpattern has exactly 64 cells after round-trip", () => {
      const loaded = loadUGIInstrument(saveUGIInstrument(makeDutyInstrument()));
      expect(loaded.subpattern).toHaveLength(64);
    });
  });

  describe("error handling", () => {
    test("throws on buffer that is too small", () => {
      const tinyBuffer = Buffer.alloc(100);
      expect(() => loadUGIInstrument(tinyBuffer)).toThrow(/too small/i);
    });

    test("throws on invalid instrument type byte", () => {
      const buf = saveUGIInstrument(makeDutyInstrument());
      // Overwrite the type uint32 with an invalid value (little-endian)
      buf.writeUInt32LE(99, 0);
      expect(() => loadUGIInstrument(buf)).toThrow(/invalid.*type/i);
    });
  });
});
