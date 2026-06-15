import {
  createPattern,
  createPatternCell,
  createSubPatternCell,
  createSubPattern,
  createSong,
  addDutyInstrument,
  addWaveInstrument,
  addNoiseInstrument,
} from "../../../../src/shared/lib/uge/song";
import type {
  DutyInstrument,
  WaveInstrument,
  NoiseInstrument,
} from "../../../../src/shared/lib/uge/types";

const makeDutyInstrument = (overrides = {}): DutyInstrument => ({
  index: 0,
  name: "",
  length: null,
  dutyCycle: 2,
  initialVolume: 15,
  volumeSweepChange: 0,
  frequencySweepTime: 0,
  frequencySweepShift: 0,
  subpatternEnabled: false,
  subpattern: createSubPattern(),
  ...overrides,
});

const makeWaveInstrument = (overrides = {}): WaveInstrument => ({
  index: 0,
  name: "",
  length: null,
  volume: 3,
  waveIndex: 0,
  subpatternEnabled: false,
  subpattern: createSubPattern(),
  ...overrides,
});

const makeNoiseInstrument = (overrides = {}): NoiseInstrument => ({
  index: 0,
  name: "",
  length: null,
  initialVolume: 15,
  volumeSweepChange: 0,
  bitCount: 15,
  subpatternEnabled: false,
  subpattern: createSubPattern(),
  ...overrides,
});

describe("createPatternCell", () => {
  it("creates a cell with all fields null", () => {
    const cell = createPatternCell();
    expect(cell.note).toBeNull();
    expect(cell.instrument).toBeNull();
    expect(cell.effectCode).toBeNull();
    expect(cell.effectParam).toBeNull();
  });
});

describe("createSubPatternCell", () => {
  it("creates a cell with all fields null", () => {
    const cell = createSubPatternCell();
    expect(cell.note).toBeNull();
    expect(cell.jump).toBeNull();
    expect(cell.effectCode).toBeNull();
    expect(cell.effectParam).toBeNull();
  });
});

describe("createPattern", () => {
  it("creates a pattern with TRACKER_PATTERN_LENGTH rows", () => {
    const pattern = createPattern();
    expect(pattern).toHaveLength(64); // TRACKER_PATTERN_LENGTH = 64
  });

  it("all cells start as empty PatternCells", () => {
    const pattern = createPattern();
    const cell = pattern[0];
    expect(cell.note).toBeNull();
    expect(cell.instrument).toBeNull();
  });
});

describe("createSubPattern", () => {
  it("creates a subpattern with TRACKER_SUBPATTERN_LENGTH cells", () => {
    const sub = createSubPattern();
    expect(sub.length).toBeGreaterThan(0);
  });

  it("all cells start as empty SubPatternCells", () => {
    const sub = createSubPattern();
    expect(sub[0]?.note).toBeNull();
    expect(sub[0]?.jump).toBeNull();
  });
});

describe("createSong", () => {
  it("creates a song with empty instrument lists", () => {
    const song = createSong();
    expect(song.dutyInstruments).toHaveLength(0);
    expect(song.waveInstruments).toHaveLength(0);
    expect(song.noiseInstruments).toHaveLength(0);
  });

  it("creates a song with an empty sequence", () => {
    const song = createSong();
    expect(song.sequence).toHaveLength(0);
  });

  it("creates a song with an empty patterns list", () => {
    const song = createSong();
    expect(song.patterns).toHaveLength(0);
  });
});

describe("addDutyInstrument", () => {
  it("appends a duty instrument and sets its index", () => {
    const song = createSong();
    const inst = makeDutyInstrument();
    addDutyInstrument(song, inst);
    expect(song.dutyInstruments).toHaveLength(1);
    expect(song.dutyInstruments[0]?.index).toBe(0);
  });

  it("sets incrementing indices for multiple instruments", () => {
    const song = createSong();
    addDutyInstrument(song, makeDutyInstrument());
    addDutyInstrument(song, makeDutyInstrument());
    expect(song.dutyInstruments[1]?.index).toBe(1);
  });
});

describe("addWaveInstrument", () => {
  it("appends a wave instrument and sets its index", () => {
    const song = createSong();
    const inst = makeWaveInstrument();
    addWaveInstrument(song, inst);
    expect(song.waveInstruments).toHaveLength(1);
    expect(song.waveInstruments[0]?.index).toBe(0);
  });
});

describe("addNoiseInstrument", () => {
  it("appends a noise instrument and sets its index", () => {
    const song = createSong();
    const inst = makeNoiseInstrument();
    addNoiseInstrument(song, inst);
    expect(song.noiseInstruments).toHaveLength(1);
    expect(song.noiseInstruments[0]?.index).toBe(0);
  });
});
