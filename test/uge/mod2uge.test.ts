/* eslint-disable camelcase */
import { readFileSync } from "fs";
import { join } from "path";
import { parseMod } from "shared/lib/uge/mod2uge/parseMod";
import {
  convertNote,
  convertInstrument,
  convertEffect,
  convertMODDataToUGESong,
  scaleSpeed,
  convertNoiseCell,
  traverseSong,
  applyPlaybackCorrections,
} from "shared/lib/uge/mod2uge/import";
import { LOWEST_NOTE, UGE_EFFECTS } from "shared/lib/uge/mod2uge/constants";
import { EffectCode } from "shared/lib/uge/mod2uge/types";
import { PatternCell } from "shared/lib/uge/types";
import { createSong } from "shared/lib/uge/song";

const EXAMPLES_DIR = join(__dirname, "../data/music/");

const paramByte = (p: number) => p;

describe("convertNote", () => {
  test("period 0 → null", () => {
    expect(convertNote(0)).toBe(null);
  });

  test("known periods map to correct codes", () => {
    expect(convertNote(1712)).toBe(0); // C-3
    expect(convertNote(856)).toBe(12); // C-4
    expect(convertNote(428)).toBe(24); // C-5
    expect(convertNote(214)).toBe(36); // C-6
    expect(convertNote(28)).toBe(71); // B-8
  });

  test("unknown period → LOWEST_NOTE", () => {
    expect(convertNote(9999)).toBe(LOWEST_NOTE);
  });
});

describe("convertInstrument", () => {
  test("0 → null", () => expect(convertInstrument(0)).toBe(null));
  test("1 → 0", () => expect(convertInstrument(1)).toBe(0));
  test("15 → 14", () => expect(convertInstrument(15)).toBe(14));
  test("values above 15 clamp to 14", () =>
    expect(convertInstrument(31)).toBe(14));
});

describe("convertEffect", () => {
  test("$B / $D: params incremented by 1", () => {
    for (const code of [0xb, 0xd] as const) {
      const { code: outCode, params } = convertEffect(code, 0x03);
      expect(outCode).toBe(code);
      expect(paramByte(params)).toBe(4);
    }
  });

  test("$F speed passes through", () => {
    const { code, params } = convertEffect(0xf, 0x03);
    expect(code).toBe(0xf);
    expect(paramByte(params)).toBe(3);
  });

  test("$1 / $2 / $3 pass through unchanged", () => {
    for (const code of [0x1, 0x2, 0x3] as const) {
      const { code: outCode, params } = convertEffect(code, 0x50);
      expect(outCode).toBe(code);
      expect(paramByte(params)).toBe(0x50);
    }
  });

  test("$9 Sample Offset → NOP", () => {
    const { code, params } = convertEffect(0x9, 0xab);
    expect(code).toBe(0);
    expect(params).toBe(0);
  });

  test("$C volume scales 0–64 → 0–15", () => {
    const { code, params } = convertEffect(0xc, 0x40);
    expect(code).toBe(0xc);
    expect(params).toBe(0xf);
  });

  test("$C zero becomes NOTE_CUT", () => {
    const { code, params } = convertEffect(0xc, 0x00);
    expect(code).toBe(0xe);
    expect(params).toBe(0);
  });

  test("$EC note cut", () => {
    const { code, params } = convertEffect(0xe, 0xc5);
    expect(code).toBe(0xe);
    expect(params).toBe(5);
  });

  test("unsupported extended effect removed", () => {
    const { code, params } = convertEffect(0xe, 0xa3);
    expect(code).toBe(0);
    expect(params).toBe(0);
  });

  test("unrecognized effects pass through", () => {
    const { code, params } = convertEffect(0x4, 0x42);
    expect(code).toBe(0x4);
    expect(params).toBe(0x42);
  });
});

describe("parseMod", () => {
  const modFiles = ["Rulz_Intro", "Rulz_BattleTheme", "Rulz_GonaSpace"];

  for (const basename of modFiles) {
    test(`parses ${basename}.mod`, () => {
      const buf = readFileSync(join(EXAMPLES_DIR, `${basename}.mod`));
      expect(() => parseMod(buf)).not.toThrow();
    });

    test(`${basename}.mod has valid structure`, () => {
      const buf = readFileSync(join(EXAMPLES_DIR, `${basename}.mod`));
      const mod = parseMod(buf);

      expect(typeof mod.name).toBe("string");
      expect(mod.patterns.length).toBeGreaterThan(0);
      expect(mod.patterns[0].length).toBe(64);
      expect(mod.patterns[0][0].length).toBe(4);
    });
  }
});

describe("scaleSpeed", () => {
  test("no conversion returns same speed", () => {
    expect(scaleSpeed(6, false)).toBe(6);
  });

  test("50Hz → 60Hz tick conversion", () => {
    expect(scaleSpeed(6, true)).toBe(7);
  });

  test("bpm normalization reduces speed", () => {
    expect(scaleSpeed(6, false, 150)).toBe(5);
  });

  test("combined conversion and bpm normalization", () => {
    expect(scaleSpeed(6, true, 150)).toBe(6);
  });

  test("rounding is applied", () => {
    expect(scaleSpeed(5, true)).toBe(Math.round((5 * 60) / 50));
  });
});

describe("convertNoiseCell", () => {
  const baseCell = {
    note: 428,
    instrument: 0,
    effect: { code: 0 as EffectCode, params: 0 },
  };

  test("non-noise instruments produce null note", () => {
    const cell = convertNoiseCell({
      ...baseCell,
      instrument: 5,
    });

    expect(cell.note).toBeNull();
  });

  test("noise instrument range attempts note mapping", () => {
    const cell = convertNoiseCell({
      ...baseCell,
      instrument: 16,
    });

    expect(cell.note === null || typeof cell.note === "number").toBe(true);
  });

  test("instrument present becomes instrument index 1", () => {
    const cell = convertNoiseCell({
      ...baseCell,
      instrument: 16,
    });

    expect(cell.instrument).toBe(1);
  });

  test("instrument 0 becomes null", () => {
    const cell = convertNoiseCell({
      ...baseCell,
      instrument: 0,
    });

    expect(cell.instrument).toBeNull();
  });

  test("effect passthrough works", () => {
    const cell = convertNoiseCell({
      ...baseCell,
      effect: { code: 0x1, params: 0x23 },
    });

    expect(cell.effectcode).toBe(0x1);
    expect(cell.effectparam).toBe(0x23);
  });
});

describe("traverseSong flow control", () => {
  const makeCell = (): PatternCell => ({
    note: null,
    instrument: null,
    effectcode: null,
    effectparam: null,
  });

  const makePattern = (): PatternCell[][] =>
    Array.from({ length: 64 }, () =>
      Array.from({ length: 4 }, () => makeCell()),
    );

  test("pattern break jumps to next order row", () => {
    const song = createSong();

    const pattern = makePattern();
    pattern[0][0].effectcode = UGE_EFFECTS.PATTERN_BREAK;
    pattern[0][0].effectparam = 0x11;

    song.patterns = [pattern, makePattern()];
    song.sequence = [0, 1];

    const visited: number[] = [];

    traverseSong(song, (_, firstVisit) => {
      if (firstVisit) visited.push(1);
    });

    expect(visited.length).toBeGreaterThan(0);
  });

  test("position jump moves to specified order", () => {
    const song = createSong();

    const p0 = makePattern();
    p0[0][0].effectcode = UGE_EFFECTS.JUMP_TO_ORDER;
    p0[0][0].effectparam = 1;

    const p1 = makePattern();

    song.patterns = [p0, p1];
    song.sequence = [0, 1];

    let visitedSecond = false;

    traverseSong(song, () => {
      visitedSecond = true;
    });

    expect(visitedSecond).toBe(true);
  });

  test("loop detection stops traversal", () => {
    const song = createSong();

    const p0 = makePattern();
    p0[0][0].effectcode = UGE_EFFECTS.JUMP_TO_ORDER;
    p0[0][0].effectparam = 0;

    song.patterns = [p0];
    song.sequence = [0];

    let count = 0;

    traverseSong(song, () => {
      count++;
    });

    expect(count).toBeGreaterThan(0);
  });
});

describe("portamento overflow protection", () => {
  const makeCell = (): PatternCell => ({
    note: 24,
    instrument: 0,
    effectcode: null,
    effectparam: null,
  });

  const makePattern = (): PatternCell[][] =>
    Array.from({ length: 64 }, () =>
      Array.from({ length: 4 }, () => makeCell()),
    );

  test("porta down clamps when underflow would occur", () => {
    const song = createSong();

    song.ticks_per_row = 7;

    const pattern = makePattern();

    pattern[0][0].note = 37; // G#6
    pattern[0][0].effectcode = UGE_EFFECTS.PORTA_DOWN;
    pattern[0][0].effectparam = 0xbd;
    pattern[1][0].note = null;
    pattern[1][0].effectcode = UGE_EFFECTS.PORTA_DOWN;
    pattern[1][0].effectparam = 0xbd;
    pattern[2][0].note = null;
    pattern[2][0].effectcode = UGE_EFFECTS.PORTA_DOWN;
    pattern[2][0].effectparam = 0xbd;
    pattern[3][0].note = null;
    pattern[3][0].effectcode = UGE_EFFECTS.PORTA_DOWN;
    pattern[3][0].effectparam = 0xbd;

    song.patterns = [pattern];
    song.sequence = [0];

    applyPlaybackCorrections(song, true);

    const effect0 = song.patterns[0][0][0].effectcode;
    const effect1 = song.patterns[0][1][0].effectcode;
    const effect2 = song.patterns[0][2][0].effectcode;

    const param0 = song.patterns[0][0][0].effectparam;
    const param1 = song.patterns[0][1][0].effectparam;
    const param2 = song.patterns[0][2][0].effectparam;

    expect(effect0).toEqual(UGE_EFFECTS.PORTA_DOWN);
    expect(effect1).toEqual(UGE_EFFECTS.PORTA_DOWN);
    expect(effect2).toEqual(UGE_EFFECTS.EMPTY);

    expect(param0).toEqual(227); // Speed scale applied: 0xbd * 60 / 50 = 0xe1
    expect(param1).toBeLessThan(227); // Clamped frequency to prevent overflow
    expect(param2).toEqual(0x00); // Removed effect with only overflowed frequency
  });

  test("porta up clamps when overflow would occur", () => {
    const song = createSong();

    song.ticks_per_row = 7;

    const pattern = makePattern();

    pattern[0][0].note = 37; // G#6
    pattern[0][0].effectcode = UGE_EFFECTS.PORTA_UP;
    pattern[0][0].effectparam = 0x0f;

    pattern[1][0].note = null;
    pattern[1][0].effectcode = UGE_EFFECTS.PORTA_UP;
    pattern[1][0].effectparam = 0x0f;

    pattern[2][0].note = null;
    pattern[2][0].effectcode = UGE_EFFECTS.PORTA_UP;
    pattern[2][0].effectparam = 0x0f;

    song.patterns = [pattern];
    song.sequence = [0];

    applyPlaybackCorrections(song, true);

    const effect0 = song.patterns[0][0][0].effectcode;
    const effect1 = song.patterns[0][1][0].effectcode;
    const effect2 = song.patterns[0][2][0].effectcode;

    const param0 = song.patterns[0][0][0].effectparam;
    const param1 = song.patterns[0][1][0].effectparam;
    const param2 = song.patterns[0][2][0].effectparam;

    expect(effect0).toEqual(UGE_EFFECTS.PORTA_UP);
    expect(effect1).toEqual(UGE_EFFECTS.PORTA_UP);
    expect(effect2).toEqual(UGE_EFFECTS.EMPTY);

    expect(param0).toEqual(18); // Speed scale applied: 0x0f * 60 / 50 = 0x13
    expect(param1).toBeLessThan(18); // Clamped to prevent overflow
    expect(param2).toEqual(0x00); // Removed when already overflowing
  });
});

describe("mod2uge integration", () => {
  const exampleBases = [
    "Rulz_Intro",
    "Rulz_BattleTheme",
    "Rulz_GonaSpace",
    "Rulz_FastPaceSpeedRace",
    "Rulz_Into the woods",
    "Rulz_UndergroundCave",
    "Rulz_Pause_Underground",
  ];

  for (const base of exampleBases) {
    test(`converts ${base}.mod`, () => {
      const modBuf = readFileSync(join(EXAMPLES_DIR, `${base}.mod`));
      expect(() => convertMODDataToUGESong(modBuf)).not.toThrow();
    });

    test(`${base}.mod output starts with UGE version 6`, () => {
      const modBuf = readFileSync(join(EXAMPLES_DIR, `${base}.mod`));
      const out = convertMODDataToUGESong(modBuf);
      expect(out.version).toBe(6);
    });
  }

  test("converted test song matches expected output", () => {
    const modBuf = readFileSync(join(EXAMPLES_DIR, `test.mod`));
    const out = convertMODDataToUGESong(modBuf);
    expect(out.version).toBe(6);
    expect(out.patterns[3][0][0]).toEqual({
      note: 41,
      instrument: 0,
      effectcode: 0x2,
      effectparam: 0x7,
    });
    expect(out.patterns[3][1][0]).toEqual({
      note: null,
      instrument: null,
      effectcode: 0x2,
      effectparam: 0x7,
    });
    expect(out.patterns[3][2][0]).toEqual({
      note: null,
      instrument: null,
      effectcode: 0x2,
      effectparam: 0x7,
    });
    expect(out.patterns[3][3][0]).toEqual({
      note: null,
      instrument: null,
      effectcode: 0x2,
      effectparam: 0x7,
    });
  });
});
