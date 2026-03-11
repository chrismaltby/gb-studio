/* eslint-disable camelcase */
import type { MODFile, MODCell, EffectCode } from "./types";
import { parseMod } from "./parseMod";
import {
  LOWEST_NOTE,
  C_5,
  PERIOD_TO_CODE,
  GBT_WAVEFORMS,
  GBT_NOISE,
  CH4_FREQ_TO_NOTE,
  DEFAULT_WAVES_8_15,
  GB_NOTE_TABLE,
  UGE_EFFECTS,
  PATTERN_LENGTH,
  CHANNEL_NOISE,
  MOD_INITIAL_BPM,
  MAX_FREQ,
  MOD_EFFECTS,
  MOD_EXTENDED_EFFECTS,
} from "./constants";
import {
  createSong,
  addDutyInstrument,
  addWaveInstrument,
  addNoiseInstrument,
} from "shared/lib/uge/song";
import {
  DutyInstrument,
  NoiseInstrument,
  PatternCell,
  Song,
  SubPatternCell,
  WaveInstrument,
} from "shared/lib/uge/types";

/**
 * Convert a MOD file buffer to a UGE song
 */
export const convertMODDataToUGESong = (
  input: Buffer,
  speedConversion = true,
): Song => {
  const mod = parseMod(input);
  return convertMODToUGESong(mod, speedConversion);
};

const convertMODToUGESong = (mod: MODFile, speedConversion: boolean): Song => {
  const song = createSong();
  song.name = mod.name;

  initializeInstruments(song);
  initializeWaves(song);

  for (let i = 0; i < mod.patterns.length; i++) {
    const pattern = transcribePattern(mod.patterns[i]);
    song.patterns.push(pattern);
  }

  song.sequence = mod.positions.slice(0, mod.songLen);

  applyPlaybackCorrections(song, speedConversion);

  return song;
};

const transcribePattern = (modPattern: MODCell[][]): PatternCell[][] => {
  const pattern: PatternCell[][] = [];

  for (let row = 0; row < PATTERN_LENGTH; row++) {
    const rowCells: PatternCell[] = [];

    for (let ch = 0; ch < 4; ch++) {
      const modCell = modPattern[row][ch];

      if (ch === CHANNEL_NOISE) {
        rowCells.push(convertNoiseCell(modCell));
      } else {
        rowCells.push(convertCell(modCell));
      }
    }

    pattern.push(rowCells);
  }

  return pattern;
};

/**
 * Scale a MOD ticks-per-row value to its GB equivalent.
 */
export const scaleSpeed = (
  speed: number,
  speedConversion: boolean,
  bpm?: number,
): number => {
  let result = speed;

  // 50Hz/60Hz tick conversion
  if (speedConversion) {
    result *= 60 / 50;
  }

  // BPM normalization
  if (bpm !== undefined) {
    result *= MOD_INITIAL_BPM / bpm;
  }

  return Math.round(result);
};

/**
 * Convert MOD cell to UGE.
 */
const convertCell = (modRow: MODCell): PatternCell => {
  const note = convertNote(modRow.note);
  const instrument = convertInstrument(modRow.instrument);

  const { code, params } = convertEffect(
    modRow.effect.code,
    modRow.effect.params,
  );

  const isEmptyEffect = code === UGE_EFFECTS.EMPTY && params === 0;

  return {
    note,
    instrument,
    effectcode: isEmptyEffect ? null : code,
    effectparam: isEmptyEffect ? null : params,
  };
};

/**
 * Convert a noise channel MOD cell to UGE.
 */
export const convertNoiseCell = (modRow: MODCell): PatternCell => {
  const { code, params } = convertEffect(
    modRow.effect.code,
    modRow.effect.params,
  );

  const isEmptyEffect = code === UGE_EFFECTS.EMPTY && params === 0;

  let note: number | null = null;

  const noteIndex = PERIOD_TO_CODE.get(modRow.note);

  if (noteIndex !== undefined) {
    if (modRow.instrument >= 16 && modRow.instrument < 32) {
      const instrIndex = (modRow.instrument - 16) & 0x1f;
      const instrument = GBT_NOISE[instrIndex];

      let noiseBreak = (instrument & 0x03) | (((instrument & 0xf0) >> 2) + 4);
      noiseBreak = noiseBreak - (Math.trunc((noteIndex + 1) / 3) - 8);

      const noise =
        (noiseBreak & 0x03) |
        ((Math.max(0, noiseBreak - 4) & 0x3c) << 2) |
        (noiseBreak > 3 ? 0x04 : 0x00) |
        (instrument & 0x08);

      const dividingRatio = noise & 0x07;
      const shiftClockFreq = (noise >> 4) & 0x0f;

      const realR = dividingRatio === 0 ? 0.5 : dividingRatio;

      const ch4Freq = Math.trunc(
        524288 / realR / Math.pow(2, shiftClockFreq + 1),
      );

      const mappedNote = CH4_FREQ_TO_NOTE.get(ch4Freq);
      if (mappedNote !== undefined) note = mappedNote;
    }
  }

  return {
    note,
    instrument: modRow.instrument ? 1 : null,
    effectcode: isEmptyEffect ? null : code,
    effectparam: isEmptyEffect ? null : params,
  };
};

export const convertNote = (period: number): number | null => {
  if (period === 0) return null;
  const code = PERIOD_TO_CODE.get(period);
  return code !== undefined ? code : LOWEST_NOTE;
};

export const convertInstrument = (instr: number): number | null => {
  if (instr === 0) return null;
  return Math.min(15, instr) - 1;
};

/**
 * Convert a MOD effect to a UGE effect.
 */
export const convertEffect = (
  code: EffectCode,
  params: number,
): { code: EffectCode; params: number } => {
  const { lo, hi } = toEffectParamParts(params);

  switch (code) {
    case MOD_EFFECTS.PORTA_VOL_SLIDE:
    case MOD_EFFECTS.VIBRATO_VOL_SLIDE:
    case MOD_EFFECTS.TREMOLO:
    case MOD_EFFECTS.PANNING:
    case MOD_EFFECTS.SAMPLE_OFFSET:
      // Not supported so removed
      return makeEmptyEffect();

    case MOD_EFFECTS.POSITION_JUMP:
    case MOD_EFFECTS.PATTERN_BREAK:
      // MOD 0-indexed, UGE 1-indexed
      return { code, params: params + 1 };

    case MOD_EFFECTS.SET_VOLUME:
      if (params !== 0) {
        // Scale from 0-64 range to 0-15
        return {
          code: UGE_EFFECTS.SET_VOLUME,
          params: Math.floor((params / 0x40) * 0xf),
        };
      } else {
        // Replace with note cut
        return { code: UGE_EFFECTS.NOTE_CUT, params: 0 };
      }

    case MOD_EFFECTS.EXTENDED:
      if (hi === MOD_EXTENDED_EFFECTS.NOTE_CUT) {
        return { code: UGE_EFFECTS.NOTE_CUT, params: lo };
      }
      if (hi === MOD_EXTENDED_EFFECTS.NOTE_DELAY) {
        return { code: UGE_EFFECTS.NOTE_DELAY, params: lo };
      }
      // All other extended effects are not supported, so remove
      return makeEmptyEffect();

    case MOD_EFFECTS.ARPEGGIO:
    case MOD_EFFECTS.PORTA_UP:
    case MOD_EFFECTS.PORTA_DOWN:
    case MOD_EFFECTS.TONE_PORTA:
    case MOD_EFFECTS.VIBRATO:
    case MOD_EFFECTS.VOLUME_SLIDE:
    case MOD_EFFECTS.SET_SPEED_TEMPO:
      // Keep args as is
      return { code, params };

    default:
      assertUnreachable(code);
  }

  return makeEmptyEffect();
};

/**
 * Create a zeroed-out effect
 */
const makeEmptyEffect = (): {
  code: EffectCode;
  params: number;
} => {
  return { code: UGE_EFFECTS.EMPTY, params: 0 };
};

/**
 * Split effect parameter into hi and lo nibbles
 */
const toEffectParamParts = (params: number): { hi: number; lo: number } => {
  const lo = params & 0x0f;
  const hi = (params >> 4) & 0x0f;
  return { hi, lo };
};

/**
 * Traverse the song in playback order and apply scale timing and apply fixes
 * for effects that would cause unintended behavior
 */
export const applyPlaybackCorrections = (
  song: Song,
  speedConversion: boolean,
): void => {
  let baseSpeed = song.ticks_per_row;
  let speed = scaleSpeed(song.ticks_per_row, speedConversion);
  let bpm = MOD_INITIAL_BPM;

  const freq = [0, 0, 0, 0];
  const lastPlayedNote = [C_5, C_5, C_5, C_5];
  const lastPlayedInstrument = [0, 0, 0, 0];

  song.ticks_per_row = speed;

  traverseSong(song, (row, firstVisit) => {
    // Apply speed + bpm scaling and fill in missing note/instruments for volume slides
    for (let ch = 0; ch < row.length; ch++) {
      const cell = row[ch];

      // SET SPEED / TEMPO
      if (cell.effectcode === UGE_EFFECTS.SET_SPEED) {
        if (firstVisit) {
          const param = cell.effectparam ?? 0;
          if (param >= 0x20) {
            bpm = param;
          } else {
            baseSpeed = param;
          }
          speed = scaleSpeed(baseSpeed, speedConversion, bpm);
          cell.effectparam = speed;
        } else {
          // Already applied speed conversion, use value as is
          speed = cell.effectparam ?? 0;
        }
      }

      // SET VOLUME
      if (cell.effectcode === UGE_EFFECTS.SET_VOLUME) {
        if (cell.instrument === null) {
          cell.instrument = lastPlayedInstrument[ch];
        }
        if (cell.note === null) {
          cell.note = lastPlayedNote[ch];
        }
      }

      if (cell.note !== null) {
        lastPlayedNote[ch] = cell.note;
      }
      if (cell.instrument !== null) {
        lastPlayedInstrument[ch] = cell.instrument;
      }
    }

    const activeTicks = Math.max(1, speed - 1);

    // Fix portamento effects that would overflow/underflow the GB frequency register
    for (let ch = 0; ch < row.length; ch++) {
      const cell = row[ch];

      let startFreq = freq[ch];
      let endFreq = startFreq;

      // NOTE trigger
      if (cell.note !== null && cell.note < GB_NOTE_TABLE.length) {
        startFreq = GB_NOTE_TABLE[cell.note];
        endFreq = startFreq;
      }

      const val = cell.effectparam ?? 0;

      // PORTAMENTO DOWN
      if (cell.effectcode === UGE_EFFECTS.PORTA_DOWN) {
        if (firstVisit) {
          const scaledVal = scaleSpeed(val, speedConversion);
          endFreq = startFreq - scaledVal * activeTicks;
          // If portamento will overflow
          if (endFreq <= 0) {
            const newVal = Math.floor(startFreq / activeTicks);
            if (newVal > 0) {
              // Reduce effect to prevent overflow
              cell.effectparam = newVal;
              endFreq = startFreq - newVal * activeTicks;
            } else {
              // Remove if even a single tick would cause overflow
              cell.effectcode = UGE_EFFECTS.EMPTY;
              cell.effectparam = 0;
              endFreq = startFreq;
            }
          } else {
            cell.effectparam = scaledVal;
          }
        } else {
          endFreq = startFreq - val * activeTicks;
        }
      }

      // PORTAMENTO UP
      if (cell.effectcode === UGE_EFFECTS.PORTA_UP) {
        if (firstVisit) {
          const scaledVal = scaleSpeed(val, speedConversion);
          endFreq = startFreq + scaledVal * activeTicks;

          // If portamento will overflow
          if (endFreq >= MAX_FREQ) {
            const newVal = Math.floor((MAX_FREQ - startFreq) / activeTicks);

            if (newVal > 0) {
              // Reduce effect to prevent overflow
              cell.effectparam = newVal;
              endFreq = startFreq + newVal * activeTicks;
            } else {
              // Remove if even a single tick would cause overflow
              cell.effectcode = UGE_EFFECTS.EMPTY;
              cell.effectparam = 0;
              endFreq = startFreq;
            }
          } else {
            cell.effectparam = scaledVal;
          }
        } else {
          endFreq = startFreq + val * activeTicks;
        }
      }

      freq[ch] = endFreq;
    }
  });
};

export const traverseSong = (
  song: Song,
  cb: (row: PatternCell[], firstVisit: boolean) => void,
): void => {
  let order = 0;
  let rowIndex = 0;

  const visitedOrderRow = new Set<string>();
  const visitedPatternRow = new Set<string>();

  const songLength = song.sequence.length;

  while (true) {
    const orderRowKey = `${order}:${rowIndex}`;
    if (visitedOrderRow.has(orderRowKey)) {
      return;
    }
    visitedOrderRow.add(orderRowKey);

    const patternIndex = song.sequence[order];
    const patternRowKey = `${patternIndex}:${rowIndex}`;

    const firstVisit = !visitedPatternRow.has(patternRowKey);
    visitedPatternRow.add(patternRowKey);

    const pattern = song.patterns[patternIndex];
    const row = pattern[rowIndex];

    cb(row, firstVisit);

    let nextOrder = order;
    let nextRow = rowIndex + 1;

    // Scan row for flow control effects
    for (const cell of row) {
      const eff = cell.effectcode;
      const val = cell.effectparam ?? 0;

      // Bxx – position jump
      if (eff === UGE_EFFECTS.JUMP_TO_ORDER) {
        nextOrder = val === 0 ? order + 1 : val - 1;
        nextRow = 0;
      }

      // Dxx – pattern break
      if (eff === UGE_EFFECTS.PATTERN_BREAK) {
        const { hi, lo } = toEffectParamParts(val);
        const breakRow = Math.min(hi * 10 + lo, PATTERN_LENGTH - 1);
        if (breakRow > 0) {
          nextOrder = order + 1;
          nextRow = breakRow - 1;
        }
      }
    }

    order = nextOrder;
    rowIndex = nextRow;

    if (rowIndex >= PATTERN_LENGTH) {
      rowIndex = 0;
      order++;
    }

    if (order >= songLength) {
      return;
    }
  }
};

const assertUnreachable = (_x: never): never => {
  throw new Error("Didn't expect to get here");
};

const createBlankSubpattern = (): SubPatternCell[] => {
  return Array.from({ length: 64 }, () => {
    return {
      note: null,
      jump: 0,
      effectcode: null,
      effectparam: null,
    };
  });
};

const initializeInstruments = (song: Song): void => {
  const duty: DutyInstrument[] = Array.from({ length: 15 }, (_, index) => {
    let duty_cycle = 2;
    if (index === 0) duty_cycle = 1;
    if (index === 1) duty_cycle = 2;
    if (index === 2) duty_cycle = 3;
    if (index === 3) duty_cycle = 0;
    const instr: DutyInstrument = {
      index,
      length: null,
      name: "",
      duty_cycle,
      initial_volume: 15,
      volume_sweep_change: 0,
      frequency_sweep_time: 0,
      frequency_sweep_shift: 0,
      subpattern_enabled: false,
      subpattern: createBlankSubpattern(),
    };
    return instr;
  });
  duty.forEach((instr) => addDutyInstrument(song, instr));

  const wave: WaveInstrument[] = Array.from({ length: 15 }, (_, idx) => {
    const instr: WaveInstrument = {
      index: idx,
      name: "",
      length: null,
      volume: 1,
      wave_index: idx >= 7 ? idx - 7 : idx,
      subpattern_enabled: false,
      subpattern: createBlankSubpattern(),
    };
    return instr;
  });

  wave.forEach((instr) => addWaveInstrument(song, instr));

  const noise: NoiseInstrument[] = Array.from({ length: 15 }, (_, idx) => {
    const instr: NoiseInstrument = {
      index: idx,
      name: "",
      length: null,
      initial_volume: 15,
      volume_sweep_change: 0,
      bit_count: 15,
      dividing_ratio: 0,
      subpattern_enabled: false,
      subpattern: createBlankSubpattern(),
    };
    return instr;
  });

  noise.forEach((instr) => addNoiseInstrument(song, instr));
};

const initializeWaves = (song: Song): void => {
  song.waves = Array.from({ length: 16 }, () => new Uint8Array(32));

  for (let w = 0; w < 8; w++) {
    song.waves[8 + w] = new Uint8Array(DEFAULT_WAVES_8_15[w]);
  }

  for (let w = 0; w < 8; w++) {
    for (let j = 0; j < 16; j++) {
      const packed = GBT_WAVEFORMS[w][j];
      song.waves[w][j * 2] = (packed >> 4) & 0x0f;
      song.waves[w][j * 2 + 1] = packed & 0x0f;
    }
  }
};
