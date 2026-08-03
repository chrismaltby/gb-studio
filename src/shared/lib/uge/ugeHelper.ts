import type {
  Song,
  PatternCell,
  SubPatternCell,
  DutyInstrument,
  NoiseInstrument,
  WaveInstrument,
  Pattern,
} from "shared/lib/uge/types";
import { TRACKER_NUM_CHANNELS } from "consts";
import { noteGBDKDefines } from "shared/lib/music/constants";
import {
  addDutyInstrument,
  addNoiseInstrument,
  addWaveInstrument,
  createPattern,
  createSong,
  createSubPatternCell,
} from "./song";
import { isSplitPatternSequence } from "shared/lib/uge/editor/helpers";

interface InstrumentMap {
  [index: number]: number;
}

interface InstrumentData {
  idx: number;
  type: number;
  name: string;
  length: number;
  lengthEnabled: number;
  initialVolume: number;
  volumeSweepAmount: number;
  freqSweepTime: number;
  freqSweepShift: number;
  duty: number;
  waveOutputLevel: number;
  waveWaveformIndex: number;
  subpatternEnabled: number;
  subpattern: SubPatternCell[];
  noiseCounterStep: number;
  noiseMacro: number[];
}

/**
 * Parses a `.uge` binary buffer and returns a fully populated Song object.
 * Supports all versions of the hUGETracker format up to version 6.
 */
export const loadUGESong = (buffer: Buffer): Song => {
  const data = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;

  const uint8data = new Uint8Array(data);

  const readUint32 = () => {
    return new Uint32Array(data.slice(offset, (offset += 4)))[0];
  };

  const readUint8 = () => {
    return uint8data[offset++];
  };

  const td = new TextDecoder();
  const readText = () => {
    const len = uint8data[offset];
    let text = "";
    if (len > 0) {
      // Need to check string length > 0 here to prevent
      // ERR_ENCODING_INVALID_ENCODED_DATA when this is run from Electron main process
      text = td.decode(data.slice(offset + 1, offset + 1 + len));
    }
    offset += 256;
    return text;
  };

  const song = createSong();

  // TODO: Sanity checks on data.
  // TODO: Use `DataView` object instead of loads of Uint32Arrays
  let offset = 0;
  const version = readUint32();

  if (version < 0 || version > 6) {
    throw new Error(`UGE version ${version} is not supported by GB Studio`);
  }

  song.name = readText();
  song.artist = readText();
  song.comment = readText();

  const instrumentCount = version < 3 ? 15 : 45;

  const instrumentData: Array<InstrumentData> = [];
  for (let n = 0; n < instrumentCount; n++) {
    const type = readUint32();
    const name = readText();

    const length = readUint32();
    const lengthEnabled = readUint8();
    let initialVolume = readUint8();
    if (initialVolume > 15) {
      initialVolume = 15; // ??? bug in the song files?
    }
    const volumeDirection = readUint32();
    let volumeSweepAmount = readUint8();
    if (volumeSweepAmount !== 0) {
      volumeSweepAmount = 8 - volumeSweepAmount;
    }
    if (volumeDirection) {
      volumeSweepAmount = -volumeSweepAmount;
    }

    const freqSweepTime = readUint32();
    const freqSweepDirection = readUint32();
    let freqSweepShift = readUint32();
    if (freqSweepDirection) {
      freqSweepShift = -freqSweepShift;
    }

    const duty = readUint8();

    const waveOutputLevel = readUint32();
    const waveWaveformIndex = readUint32();

    let subpatternEnabled = 0;
    let noiseCounterStep = 0;

    const subpattern: SubPatternCell[] = [];
    if (version >= 6) {
      noiseCounterStep = readUint32();

      subpatternEnabled = readUint8();

      for (let m = 0; m < 64; m++) {
        const note = readUint32();
        offset += 4; // unused uint32 field. increase offset by 4.
        const jump = readUint32();
        const effectCode = readUint32();
        const effectParam = readUint8();

        subpattern.push({
          note: note === 90 ? null : note,
          jump,
          effectCode: effectCode === 0 && effectParam === 0 ? null : effectCode,
          effectParam:
            effectCode === 0 && effectParam === 0 ? null : effectParam,
        });
      }
    }

    const noiseMacro = [];
    if (version < 6) {
      offset += 4; // unused uint32 field. increase offset by 4.
      noiseCounterStep = readUint32();
      offset += 4; // unused uint32 field. increase offset by 4.
      if (version >= 4) {
        for (let n = 0; n < 6; n++) {
          const uint8ref = readUint8();
          const int8ref = uint8ref > 0x7f ? uint8ref - 0x100 : uint8ref;
          noiseMacro.push(int8ref);
        }
      }
    }

    instrumentData.push({
      idx: n,
      type,
      name,
      length,
      lengthEnabled,
      initialVolume,
      volumeSweepAmount,
      freqSweepTime,
      freqSweepShift,
      duty,
      waveOutputLevel,
      waveWaveformIndex,
      subpatternEnabled,
      subpattern,
      noiseCounterStep,
      noiseMacro,
    });
  }

  for (let n = 0; n < 16; n++) {
    song.waves.push(Uint8Array.from(uint8data.slice(offset, offset + 32)));
    offset += 32;
    if (version < 3) offset += 1; // older versions have an off-by-one error
  }

  song.ticksPerRow = readUint32();

  if (version >= 6) {
    song.timerEnabled = readUint8() !== 0;
    song.timerDivider = readUint32();
  }

  const patternCount = new Uint32Array(data.slice(offset, offset + 4))[0];
  if (offset + patternCount * 13 * 64 > data.byteLength) {
    throw new Error(`Song has too many patterns (${patternCount})`);
  }
  offset += 4;
  const patterns = [];
  for (let n = 0; n < patternCount; n++) {
    let patternId = 0;
    const pattern = [];
    if (version >= 5) {
      patternId = readUint32();
    } else {
      patternId = n;
    }
    for (let m = 0; m < 64; m++) {
      if (version < 6) {
        const [note, instrument, effectCode] = new Int32Array(
          data.slice(offset, offset + 3 * 4),
        );
        offset += 3 * 4;
        const effectParam = readUint8();

        pattern.push([note, instrument, effectCode, effectParam]);
      } else if (version >= 6) {
        const [note, instrument, _unused, effectCode] = new Int32Array(
          data.slice(offset, offset + 4 * 4),
        );
        offset += 4 * 4;
        const effectParam = readUint8();

        pattern.push([note, instrument, effectCode, effectParam]);
      }
    }
    /*
     If there's a repeated pattern it probably means the song was saved
     with an old version of GB Studio (3.0.2 or earlier) that didn't save the
     unique pattern ids and instead expected them to always be consecutive.
    */
    if (version === 5 && patterns[patternId]) {
      patterns[n] = pattern;
    } else {
      patterns[patternId] = pattern;
    }
  }

  const orders: number[][] = [];
  for (let n = 0; n < 4; n++) {
    const orderCount = readUint32(); // The amount of pattern orders stored in the file has an off-by-one.
    orders.push(
      Array.from(
        new Uint32Array(data.slice(offset, offset + 4 * (orderCount - 1))),
      ),
    );
    offset += 4 * orderCount;
  }
  // TODO: If version > 1 then custom routines follow.

  // Add instruments
  const dutyInstrumentMapping: InstrumentMap = {};
  const waveInstrumentMapping: InstrumentMap = {};
  const noiseInstrumentMapping: InstrumentMap = {};
  instrumentData.forEach((instrument: InstrumentData) => {
    const {
      idx,
      type,
      name,
      length,
      lengthEnabled,
      initialVolume,
      volumeSweepAmount,
      freqSweepTime,
      freqSweepShift,
      duty,
      waveOutputLevel,
      waveWaveformIndex,
      subpatternEnabled,
      subpattern,
      noiseCounterStep,
      noiseMacro,
    } = instrument;

    if (type === 0) {
      const instr = {} as DutyInstrument;

      if (lengthEnabled) {
        instr.length = 64 - length;
      } else {
        instr.length = null;
      }

      instr.name = name;
      instr.dutyCycle = duty;
      instr.initialVolume = initialVolume;
      instr.volumeSweepChange = volumeSweepAmount;

      instr.frequencySweepTime = freqSweepTime;
      instr.frequencySweepShift = freqSweepShift;

      if (version >= 6) {
        instr.subpatternEnabled = subpatternEnabled !== 0;
        instr.subpattern = subpattern;
      } else {
        instr.subpatternEnabled = false;
        instr.subpattern = [...Array(64)].map(() => createSubPatternCell());
      }

      dutyInstrumentMapping[(idx % 15) + 1] = song.dutyInstruments.length;
      addDutyInstrument(song, instr);
    } else if (type === 1) {
      const instr = {} as WaveInstrument;

      if (lengthEnabled) {
        instr.length = 256 - length;
      } else {
        instr.length = null;
      }

      instr.name = name;
      instr.volume = waveOutputLevel;
      instr.waveIndex = waveWaveformIndex;

      if (version >= 6) {
        instr.subpatternEnabled = subpatternEnabled !== 0;
        instr.subpattern = subpattern;
      } else {
        instr.subpatternEnabled = false;
        instr.subpattern = [...Array(64)].map(() => createSubPatternCell());
      }

      waveInstrumentMapping[(idx % 15) + 1] = song.waveInstruments.length;
      addWaveInstrument(song, instr);
    } else if (type === 2) {
      const instr = {} as NoiseInstrument;

      if (lengthEnabled) {
        instr.length = 64 - length;
      } else {
        instr.length = null;
      }

      instr.name = name;
      instr.initialVolume = initialVolume;
      instr.volumeSweepChange = volumeSweepAmount;
      instr.bitCount = noiseCounterStep ? 7 : 15;

      if (version >= 6) {
        instr.subpatternEnabled = subpatternEnabled !== 0;
        instr.subpattern = subpattern;
      } else {
        /* 
          Older versions of the uge format had a noise macro field for the noise instrument that needs to be migrated to the subpattern.
        */
        if (noiseMacro.length === 0) {
          // if noise macro is empty create an empty subpattern and disable
          // subpattern for this instrument
          instr.subpatternEnabled = false;
          instr.subpattern = [...Array(64)].map(() => createSubPatternCell());
        } else {
          // if noise macro is not empty migrate to the subpattern
          instr.subpatternEnabled = true;
          instr.subpattern = subpatternFromNoiseMacro(
            noiseMacro ?? [],
            song.ticksPerRow,
          );
        }
      }

      noiseInstrumentMapping[(idx % 15) + 1] = song.noiseInstruments.length;
      addNoiseInstrument(song, instr);
    } else {
      throw Error(`Invalid instrument type ${type} [${idx}, "${name}"]`);
    }
  });

  song.patterns = Array.from(patterns).map((patternData) => {
    const pattern = createPattern();
    if (!patternData) {
      return pattern;
    }

    const rowCount = Math.min(patternData.length, pattern.length);

    for (let i = 0; i < rowCount; i++) {
      const cell = pattern[i];
      const [note, instrument, effectCode, effectParam] = patternData[i];
      if (note !== 90) {
        cell.note = note;
      }
      if (instrument !== 0) {
        cell.instrument = instrument - 1;
      }
      if (effectCode !== 0 || effectParam !== 0) {
        cell.effectCode = effectCode;
        cell.effectParam = effectParam;
      }
    }

    return pattern;
  });

  song.sequence = Array.from(orders[0]).map((value, index) => {
    const channels: [number, number, number, number] = [
      orders[0][index],
      orders[1][index],
      orders[2][index],
      orders[3][index],
    ];
    return {
      splitPattern: isSplitPatternSequence(channels),
      channels,
    };
  });

  return compactUGESong(song);
};

/**
 * Serialises a Song object into a `.uge` binary buffer that is compatible
 * with hUGETracker version 6.
 */
export const saveUGESong = (rawSong: Song): Buffer => {
  const song = compactUGESong(rawSong);
  const buffer = new ArrayBuffer(1024 * 1024);
  const view = new DataView(buffer);
  let idx = 0;

  function addUint8(value: number) {
    view.setUint8(idx, value);
    idx += 1;
  }
  function addUint32(value: number) {
    view.setUint32(idx, value, true);
    idx += 4;
  }
  function addInt8(value: number) {
    view.setInt8(idx, value);
    idx += 1;
  }
  function addShortString(s: string) {
    view.setUint8(idx, s.length);
    idx += 1;
    const te = new TextEncoder();
    te.encodeInto(s, new Uint8Array(buffer, idx, idx + 255));
    idx += 255;
  }

  function addSubpattern(i: DutyInstrument | WaveInstrument | NoiseInstrument) {
    addInt8(i.subpatternEnabled ? 1 : 0);
    for (let n = 0; n < 64; n++) {
      const subpattern = i.subpattern[n];
      addUint32(subpattern?.note ?? 90);
      addUint32(0);
      addUint32(subpattern?.jump ?? 0);
      addUint32(subpattern?.effectCode ?? 0);
      addUint8(subpattern?.effectParam ?? 0);
    }
  }
  function addDutyInstrument(type: number, i: DutyInstrument) {
    addUint32(type);

    addShortString(i.name || "");
    addUint32(i.length !== null ? 64 - i.length : 0);
    addUint8(i.length === null ? 0 : 1);
    addUint8(i.initialVolume);
    addUint32(i.volumeSweepChange < 0 ? 1 : 0);
    addUint8(i.volumeSweepChange !== 0 ? 8 - Math.abs(i.volumeSweepChange) : 0);

    addUint32(i.frequencySweepTime);
    addUint32(i.frequencySweepShift < 0 ? 1 : 0);
    addUint32(Math.abs(i.frequencySweepShift));

    addUint8(i.dutyCycle);

    addUint32(0);
    addUint32(0);

    addUint32(0);

    addSubpattern(i);
  }

  function addWaveInstrument(type: number, i: WaveInstrument) {
    addUint32(type);

    addShortString(i.name || "");
    addUint32(i.length !== null ? 256 - i.length : 0);
    addUint8(i.length === null ? 0 : 1);
    addUint8(0);
    addUint32(0);
    addUint8(0);

    addUint32(0);
    addUint32(0);
    addUint32(0);

    addUint8(0);

    addUint32(i.volume);
    addUint32(i.waveIndex);

    addUint32(0);

    addSubpattern(i);
  }

  function addNoiseInstrument(type: number, i: NoiseInstrument) {
    addUint32(type);

    addShortString(i.name || "");
    addUint32(i.length !== null ? 64 - i.length : 0);
    addUint8(i.length === null ? 0 : 1);
    addUint8(i.initialVolume);
    addUint32(i.volumeSweepChange < 0 ? 1 : 0);
    addUint8(i.volumeSweepChange !== 0 ? 8 - Math.abs(i.volumeSweepChange) : 0);

    addUint32(0);
    addUint32(0);
    addUint32(0);

    addUint8(0);

    addUint32(0);
    addUint32(0);

    addUint32(i.bitCount === 7 ? 1 : 0);

    addSubpattern(i);
  }

  addUint32(6); // version
  addShortString(song.name);
  addShortString(song.artist);
  addShortString(song.comment);

  for (let n = 0; n < 15; n++) {
    addDutyInstrument(0, song.dutyInstruments[n] || {});
  }
  for (let n = 0; n < 15; n++) {
    addWaveInstrument(1, song.waveInstruments[n] || {});
  }
  for (let n = 0; n < 15; n++) {
    addNoiseInstrument(2, song.noiseInstruments[n] || {});
  }
  for (let n = 0; n < 16; n++) {
    for (let m = 0; m < 32; m++) {
      addUint8(song.waves[n] ? song.waves[n][m] : 0);
    }
  }
  addUint32(song.ticksPerRow);

  addInt8(song.timerEnabled ? 1 : 0);

  addUint32(song.timerDivider);

  addUint32(song.patterns.length);
  let patternKey = 0;
  for (const pattern of song.patterns) {
    addUint32(patternKey++);
    for (let m = 0; m < 64; m++) {
      const t = pattern[m];
      addUint32(t.note === null ? 90 : t.note);
      addUint32(t.instrument === null ? 0 : t.instrument + 1);
      addUint32(0);
      addUint32(t.effectCode === null ? 0 : t.effectCode);
      addUint8(t.effectParam === null ? 0 : t.effectParam);
    }
  }
  for (let track = 0; track < 4; track++) {
    addUint32(song.sequence.length + 1); //amount of "orders" in a uge file has an off-by-one
    for (const i of song.sequence) {
      addUint32(i.channels[track]);
    }
    addUint32(0); // add the off-by-one error
  }
  for (let n = 0; n < 16; n++) {
    addUint32(0); //Add empty routines
  }

  return Buffer.from(buffer.slice(0, idx));
};

/**
 * Compact a Song removing all unreferenced patterns
 */
export const compactUGESong = (song: Song): Song => {
  const usedBlockIds = new Set<number>();

  for (const sequenceItem of song.sequence) {
    for (const patternId of sequenceItem.channels) {
      usedBlockIds.add(Math.floor(patternId / TRACKER_NUM_CHANNELS));
    }
  }

  const nextPatterns: Pattern[] = [];
  const patternIdMap = new Map<number, number>();

  const blockCount = Math.ceil(song.patterns.length / TRACKER_NUM_CHANNELS);

  for (let blockId = 0; blockId < blockCount; blockId++) {
    if (!usedBlockIds.has(blockId)) {
      continue;
    }

    const oldBasePatternId = blockId * TRACKER_NUM_CHANNELS;
    const newBasePatternId = nextPatterns.length;

    for (
      let channelOffset = 0;
      channelOffset < TRACKER_NUM_CHANNELS;
      channelOffset++
    ) {
      const oldPatternId = oldBasePatternId + channelOffset;
      const sourcePattern = song.patterns[oldPatternId];

      if (!sourcePattern) {
        break;
      }

      patternIdMap.set(oldPatternId, newBasePatternId + channelOffset);
      nextPatterns.push(
        sourcePattern.map((cell) => ({
          ...cell,
        })) as (typeof song.patterns)[number],
      );
    }
  }

  return {
    ...song,
    patterns: nextPatterns,
    sequence: song.sequence.map((sequenceItem) => ({
      ...sequenceItem,
      channels: sequenceItem.channels.map((patternId) => {
        const mappedPatternId = patternIdMap.get(patternId);

        if (mappedPatternId === undefined) {
          throw new Error(`Unable to remap UGE pattern ${patternId}`);
        }

        return mappedPatternId;
      }) as typeof sequenceItem.channels,
    })),
  };
};

/**
 * Determine if two patterns contain identical note data
 */
const patternEqual = function (a: PatternCell[], b: PatternCell[]) {
  if (a.length !== b.length) return false;
  for (let idx = 0; idx < a.length; idx++) {
    if (a[idx].note !== b[idx].note) return false;
    if (a[idx].instrument !== b[idx].instrument) return false;
    if (a[idx].effectCode !== b[idx].effectCode) return false;
    if (a[idx].effectParam !== b[idx].effectParam) return false;
  }
  return true;
};

/**
 * Exports a Song to a GBDK-compatible C source file. The output contains
 * instrument definitions, wave data, patterns, and sequence data ready for
 * inclusion in a GB Studio game ROM.
 *
 * @param song - The song to export.
 * @param trackName - C identifier used as the base name for exported symbols.
 */
export const exportToC = (song: Song, trackName: string): string => {
  type InstrumentType = "duty" | "wave" | "noise";

  const decHex = (n: number, maxLength = 2) => {
    return "0x" + n.toString(16).toUpperCase().padStart(maxLength, "0");
  };

  const findPattern = function (pattern: PatternCell[]) {
    for (let idx = 0; idx < patterns.length; idx++) {
      if (patternEqual(pattern, patterns[idx])) return idx;
    }
    return null;
  };

  const getSequenceMappingFor = function (track: number) {
    return song.sequence
      .map((sequence) => `song_pattern_${patternMap[sequence.channels[track]]}`)
      .join(", ");
  };

  const formatPatternCell = function (cell: PatternCell) {
    const note = cell.note !== null ? noteGBDKDefines[cell.note] : "___";
    let instrument = 0;
    let effectCode = 0;
    let effectParam = 0;
    if (cell.instrument !== null) instrument = cell.instrument + 1;
    if (cell.effectCode !== null) {
      effectCode = cell.effectCode;
      effectParam = cell.effectParam || 0;
    }
    return `DN(${note}, ${instrument}, ${decHex(
      (effectCode << 8) | effectParam,
      3,
    )})`;
  };

  const formatSubPatternCell = function (
    cell: SubPatternCell,
    isLast: boolean,
  ) {
    const note = cell.note ?? "___";
    const jump = cell.jump !== null && isLast ? 1 : (cell.jump ?? 0);
    let effectCode = 0;
    let effectParam = 0;
    if (cell.effectCode !== null) {
      effectCode = cell.effectCode;
      effectParam = cell.effectParam || 0;
    }
    return `DN(${note}, ${jump}, ${decHex(
      (effectCode << 8) | effectParam,
      3,
    )})`;
  };

  const getUsedInstrumentIndexes = function () {
    const usedInstruments: Record<InstrumentType, Set<number>> = {
      duty: new Set(),
      wave: new Set(),
      noise: new Set(),
    };

    const instrumentTypeByTrack: InstrumentType[] = [
      "duty",
      "duty",
      "wave",
      "noise",
    ];

    for (const sequenceItem of song.sequence) {
      for (let track = 0; track < TRACKER_NUM_CHANNELS; track++) {
        const pattern = song.patterns[sequenceItem.channels[track]];

        if (!pattern) {
          continue;
        }

        const instrumentType = instrumentTypeByTrack[track];

        for (const cell of pattern) {
          if (cell.note !== null && cell.instrument !== null) {
            usedInstruments[instrumentType].add(cell.instrument);
          }
        }
      }
    }

    return usedInstruments;
  };

  const formatDutyInstrument = function (instr: DutyInstrument) {
    const sweep =
      (instr.frequencySweepTime << 4) |
      (instr.frequencySweepShift < 0 ? 0x08 : 0x00) |
      Math.abs(instr.frequencySweepShift);
    const lenDuty =
      (instr.dutyCycle << 6) |
      ((instr.length !== null ? 64 - instr.length : 0) & 0x3f);
    let envelope =
      (instr.initialVolume << 4) | (instr.volumeSweepChange > 0 ? 0x08 : 0x00);
    if (instr.volumeSweepChange !== 0) {
      envelope |= 8 - Math.abs(instr.volumeSweepChange);
    }
    const subpatternRef = dutySubpatternRefs.get(instr.index) ?? 0;
    const highmask = 0x80 | (instr.length !== null ? 0x40 : 0);

    return `{ ${decHex(sweep)}, ${decHex(lenDuty)}, ${decHex(
      envelope,
    )}, ${subpatternRef}, ${decHex(highmask)} }`;
  };

  const formatWaveInstrument = function (instr: WaveInstrument) {
    const length = (instr.length !== null ? 256 - instr.length : 0) & 0xff;
    const volume = instr.volume << 5;
    const waveform = instr.waveIndex;
    const subpatternRef = waveSubpatternRefs.get(instr.index) ?? 0;
    const highmask = 0x80 | (instr.length !== null ? 0x40 : 0);

    return `{ ${decHex(length)}, ${decHex(volume)}, ${decHex(
      waveform,
    )}, ${subpatternRef}, ${decHex(highmask)} }`;
  };

  const formatNoiseInstrument = function (instr: NoiseInstrument) {
    let envelope =
      (instr.initialVolume << 4) | (instr.volumeSweepChange > 0 ? 0x08 : 0x00);
    if (instr.volumeSweepChange !== 0)
      envelope |= 8 - Math.abs(instr.volumeSweepChange);
    const subpatternRef = noiseSubpatternRefs.get(instr.index) ?? 0;
    let highmask = (instr.length !== null ? 64 - instr.length : 0) & 0x3f;
    if (instr.length !== null) highmask |= 0x40;
    if (instr.bitCount === 7) highmask |= 0x80;

    return `{ ${decHex(envelope)}, ${subpatternRef}, ${decHex(
      highmask,
    )}, 0, 0 }`;
  };

  const formatWave = function (wave: Uint8Array) {
    return Array.from(Array(16).keys(), (n) =>
      decHex((wave[n * 2] << 4) | wave[n * 2 + 1]),
    ).join(", ");
  };

  // Load patterns
  const patterns: PatternCell[][] = [];
  const patternMap: { [key: string]: number } = {};

  const usedPatternIds = new Set<number>();
  for (const sequenceItem of song.sequence) {
    for (const patternId of sequenceItem.channels) {
      usedPatternIds.add(patternId);
    }
  }

  for (let n = 0; n < song.patterns.length; n++) {
    if (!usedPatternIds.has(n)) {
      continue;
    }

    const sourcePattern = song.patterns[n];
    const targetPattern = [];
    for (let m = 0; m < sourcePattern.length; m++) {
      targetPattern.push(sourcePattern[m]);
    }
    const idx = findPattern(targetPattern);
    if (idx !== null) {
      patternMap[n] = idx;
    } else {
      patternMap[n] = patterns.length;
      patterns.push(targetPattern);
    }
  }

  const usedInstrumentIndexes = getUsedInstrumentIndexes();

  const emittedSubpatterns = new Map<string, string>();
  const dutySubpatternRefs = new Map<number, string>();
  const waveSubpatternRefs = new Map<number, string>();
  const noiseSubpatternRefs = new Map<number, string>();
  const subpatternDefinitions: string[] = [];

  const registerSubpattern = (
    instr: DutyInstrument | WaveInstrument | NoiseInstrument,
    type: InstrumentType,
  ) => {
    if (
      !instr.subpatternEnabled ||
      !usedInstrumentIndexes[type].has(instr.index)
    ) {
      return;
    }

    const subpatternKey = JSON.stringify(instr.subpattern);
    let subpatternSymbol = emittedSubpatterns.get(subpatternKey);

    if (!subpatternSymbol) {
      subpatternSymbol = `subpattern_${emittedSubpatterns.size}`;
      emittedSubpatterns.set(subpatternKey, subpatternSymbol);

      let definition = `static const unsigned char ${subpatternSymbol}[] = {\n`;
      for (let idx = 0; idx < 32; idx++) {
        definition += `    ${formatSubPatternCell(
          instr.subpattern[idx],
          idx === 32 - 1,
        )},\n`;
      }
      definition += "};\n";
      subpatternDefinitions.push(definition);
    }

    if (type === "duty") {
      dutySubpatternRefs.set(instr.index, subpatternSymbol);
    } else if (type === "wave") {
      waveSubpatternRefs.set(instr.index, subpatternSymbol);
    } else {
      noiseSubpatternRefs.set(instr.index, subpatternSymbol);
    }
  };

  for (const instr of song.dutyInstruments) {
    registerSubpattern(instr, "duty");
  }
  for (const instr of song.waveInstruments) {
    registerSubpattern(instr, "wave");
  }
  for (const instr of song.noiseInstruments) {
    registerSubpattern(instr, "noise");
  }

  let data = `#pragma bank 255

#include "hUGEDriver.h"
#include <stddef.h>
#include "hUGEDriverRoutines.h"

static const unsigned char order_cnt = ${song.sequence.length * 2};
`;

  for (let idx = 0; idx < patterns.length; idx++) {
    data += `static const unsigned char song_pattern_${idx}[] = {\n`;
    for (const cell of patterns[idx]) {
      data += `    ${formatPatternCell(cell)},\n`;
    }
    data += "};\n";
  }
  for (const definition of subpatternDefinitions) {
    data += definition;
  }
  for (let track = 0; track < 4; track++)
    data += `static const unsigned char* const order${
      track + 1
    }[] = {${getSequenceMappingFor(track)}};\n`;
  data += "static const hUGEDutyInstr_t duty_instruments[] = {\n";
  for (const instr of song.dutyInstruments) {
    data += `    ${formatDutyInstrument(instr)},\n`;
  }
  data += "};\n";
  data += "static const hUGEWaveInstr_t wave_instruments[] = {\n";
  for (const instr of song.waveInstruments) {
    data += `    ${formatWaveInstrument(instr)},\n`;
  }
  data += "};\n";
  data += "static const hUGENoiseInstr_t noise_instruments[] = {\n";
  for (const instr of song.noiseInstruments) {
    data += `    ${formatNoiseInstrument(instr)},\n`;
  }
  data += "};\n";
  //data += "static const unsigned char routines[] = {\n";
  //TODO
  //data += "};\n";
  data += "static const unsigned char waves[] = {\n";
  for (const wave of song.waves) {
    data += `    ${formatWave(wave)},\n`;
  }
  data += "};\n";

  data += `
const void __at(255) __bank_${trackName}_Data;
const hUGESong_t ${trackName}_Data = {
    ${song.ticksPerRow},
    &order_cnt,
    order1, order2, order3, order4,
    duty_instruments, wave_instruments, noise_instruments,
    routines,
    waves
};
`;
  return data;
};

const subpatternFromNoiseMacro = function (
  noiseMacro: number[],
  ticksPerRow: number,
) {
  const subpattern = [...Array(64)].map(() => createSubPatternCell());
  for (let n = 0; n < 6; n++) {
    subpattern[n + 1].note = noiseMacro[n] + 36;
  }
  const wrapPoint = Math.min(ticksPerRow, 7);
  subpattern[wrapPoint - 1].jump = wrapPoint;
  return subpattern;
};
