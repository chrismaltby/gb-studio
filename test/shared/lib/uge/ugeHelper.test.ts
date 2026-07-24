import { readFileSync } from "fs";
import {
  createPattern,
  createSong,
  createSubPattern,
} from "../../../../src/shared/lib/uge/song";
import {
  compactUGESong,
  exportToC,
  loadUGESong,
  saveUGESong,
} from "../../../../src/shared/lib/uge/ugeHelper";
import { join } from "path";

const EXAMPLES_DIR = join(__dirname, "../../../data/music/");

const makePattern = (note: number, instrument: number | null = null) => {
  const pattern = createPattern();
  pattern[0] = {
    note,
    instrument,
    effectCode: null,
    effectParam: null,
  };
  return pattern;
};

const addSaveReadyInstruments = (song: ReturnType<typeof createSong>) => {
  song.dutyInstruments = Array.from({ length: 15 }, (_, index) => ({
    index,
    name: "",
    length: null,
    dutyCycle: 2,
    initialVolume: 15,
    volumeSweepChange: 0,
    frequencySweepTime: 0,
    frequencySweepShift: 0,
    subpatternEnabled: false,
    subpattern: createSubPattern(),
  }));
  song.waveInstruments = Array.from({ length: 15 }, (_, index) => ({
    index,
    name: "",
    length: null,
    volume: 3,
    waveIndex: 0,
    subpatternEnabled: false,
    subpattern: createSubPattern(),
  }));
  song.noiseInstruments = Array.from({ length: 15 }, (_, index) => ({
    index,
    name: "",
    length: null,
    initialVolume: 15,
    volumeSweepChange: 0,
    bitCount: 15 as const,
    subpatternEnabled: false,
    subpattern: createSubPattern(),
  }));
};

const makeDutyInstrument = (index: number, subpatternEnabled = false) => ({
  index,
  name: "",
  length: null,
  dutyCycle: 2,
  initialVolume: 15,
  volumeSweepChange: 0,
  frequencySweepTime: 0,
  frequencySweepShift: 0,
  subpatternEnabled,
  subpattern: createSubPattern(),
});

describe("compactUGESong", () => {
  it("removes unused 4-pattern blocks and relinks sequence channels", () => {
    const song = createSong();
    song.patterns = [
      makePattern(1),
      makePattern(2),
      makePattern(3),
      makePattern(4),
      makePattern(5),
      makePattern(6),
      makePattern(7),
      makePattern(8),
      makePattern(9),
      makePattern(10),
      makePattern(11),
      makePattern(12),
    ];
    song.sequence = [
      { splitPattern: true, channels: [8, 9, 10, 11] },
      { splitPattern: false, channels: [0, 1, 2, 3] },
    ];

    const compacted = compactUGESong(song);

    expect(compacted.patterns).toHaveLength(8);
    expect(compacted.sequence).toEqual([
      { splitPattern: true, channels: [4, 5, 6, 7] },
      { splitPattern: false, channels: [0, 1, 2, 3] },
    ]);
    expect(compacted.patterns[0]?.[0]?.note).toBe(1);
    expect(compacted.patterns[4]?.[0]?.note).toBe(9);
  });

  it("does not merge identical used blocks", () => {
    const song = createSong();
    const blockA = [
      makePattern(1),
      makePattern(2),
      makePattern(3),
      makePattern(4),
    ];
    const blockB = [
      makePattern(1),
      makePattern(2),
      makePattern(3),
      makePattern(4),
    ];

    song.patterns = [...blockA, ...blockB];
    song.sequence = [
      { splitPattern: false, channels: [0, 1, 2, 3] },
      { splitPattern: false, channels: [4, 5, 6, 7] },
    ];

    const compacted = compactUGESong(song);

    expect(compacted.patterns).toHaveLength(8);
    expect(compacted.sequence[0]?.channels).toEqual([0, 1, 2, 3]);
    expect(compacted.sequence[1]?.channels).toEqual([4, 5, 6, 7]);
  });

  it("compacts unused pattern blocks before saving", () => {
    const song = createSong();
    addSaveReadyInstruments(song);
    song.patterns = [
      makePattern(1),
      makePattern(2),
      makePattern(3),
      makePattern(4),
      makePattern(5),
      makePattern(6),
      makePattern(7),
      makePattern(8),
    ];
    song.sequence = [{ splitPattern: false, channels: [4, 5, 6, 7] }];

    const reloaded = loadUGESong(saveUGESong(song));

    expect(reloaded.patterns).toHaveLength(4);
    expect(reloaded.sequence).toEqual([
      { splitPattern: false, channels: [0, 1, 2, 3] },
    ]);
    expect(reloaded.patterns[0]?.[0]?.note).toBe(5);
  });
});

describe("loadUGESong", () => {
  it("loads .UGE files with sparse pattern data as dense pattern arrays", () => {
    const buf = readFileSync(join(EXAMPLES_DIR, "sparse.uge"));
    const song = loadUGESong(buf);

    for (let i = 0; i < song.patterns.length; i++) {
      expect(song.patterns[i]).toBeDefined();
      expect(song.patterns[i]).toHaveLength(64);
      for (let rowIndex = 0; rowIndex < 64; rowIndex++) {
        expect(song.patterns[i]?.[rowIndex]).toBeDefined();
      }
    }
  });
});

describe("exportToC", () => {
  it("only emits subpatterns for instruments that are actually used by played notes", () => {
    const song = createSong();
    song.patterns = [
      makePattern(24, 0),
      createPattern(),
      createPattern(),
      createPattern(),
    ];
    song.sequence = [{ splitPattern: false, channels: [0, 1, 2, 3] }];

    song.dutyInstruments = [
      makeDutyInstrument(0, true),
      makeDutyInstrument(1, true),
    ];
    if (song.dutyInstruments[0]?.subpattern[0]) {
      song.dutyInstruments[0].subpattern[0].note = 24;
    }
    if (song.dutyInstruments[1]?.subpattern[0]) {
      song.dutyInstruments[1].subpattern[0].note = 36;
    }

    const exported = exportToC(song, "test_track");

    expect(
      exported.match(/static const unsigned char subpattern_\d+\[] = \{/g) ??
        [],
    ).toHaveLength(1);
    expect(exported).toContain("DN(24, 0, 0x000)");
    expect(exported).toMatch(
      /static const hUGEDutyInstr_t duty_instruments\[] = \{\n\s*\{[^}]*subpattern_0[^}]*\},\n\s*\{[^}]*, 0, [^}]*\},/s,
    );
  });

  it("deduplicates identical exported subpatterns across used instruments", () => {
    const song = createSong();
    song.patterns = [
      makePattern(24, 0),
      makePattern(26, 1),
      createPattern(),
      createPattern(),
    ];
    song.sequence = [{ splitPattern: false, channels: [0, 1, 2, 3] }];

    song.dutyInstruments = [
      makeDutyInstrument(0, true),
      makeDutyInstrument(1, true),
    ];
    if (song.dutyInstruments[0]?.subpattern[0]) {
      song.dutyInstruments[0].subpattern[0].note = 24;
    }
    if (song.dutyInstruments[1]?.subpattern[0]) {
      song.dutyInstruments[1].subpattern[0].note = 24;
    }

    const exported = exportToC(song, "test_track");

    expect(
      exported.match(/static const unsigned char subpattern_\d+\[] = \{/g) ??
        [],
    ).toHaveLength(1);
    expect(exported).toContain("subpattern_0");
    expect(exported).not.toContain("subpattern_1");
    expect(
      exported.match(/\{[^}]*subpattern_0[^}]*\}/g)?.length ?? 0,
    ).toBeGreaterThanOrEqual(2);
  });

  it("does not treat instrument-only cells as used instruments", () => {
    const song = createSong();
    song.patterns = [
      createPattern(),
      createPattern(),
      createPattern(),
      createPattern(),
    ];
    if (song.patterns[0]?.[0]) {
      song.patterns[0][0].instrument = 0;
    }
    song.sequence = [{ splitPattern: false, channels: [0, 1, 2, 3] }];

    song.dutyInstruments = [makeDutyInstrument(0, true)];
    if (song.dutyInstruments[0]?.subpattern[0]) {
      song.dutyInstruments[0].subpattern[0].note = 24;
    }

    const exported = exportToC(song, "test_track");

    expect(exported).not.toContain("static const unsigned char subpattern_0[]");
  });

  it("does not include unused patterns in generated output", () => {
    const song = createSong();
    song.patterns = [
      createPattern(),
      createPattern(),
      createPattern(),
      createPattern(),
    ];
    if (song.patterns[0]?.[0]) {
      song.patterns[0][0].instrument = 3;
    }
    if (song.patterns[1]?.[0]) {
      song.patterns[1][0].instrument = 4;
    }
    if (song.patterns[2]?.[0]) {
      song.patterns[2][0].instrument = 5;
    }
    if (song.patterns[3]?.[0]) {
      song.patterns[3][0].instrument = 6;
    }

    song.sequence = [{ splitPattern: true, channels: [0, 0, 1, 1] }];

    const exported = exportToC(song, "test_track");

    expect(
      exported.match(/static const unsigned char song_pattern_\d+\[\]/g),
    ).toHaveLength(2);
  });
});
