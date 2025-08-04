/* eslint-disable camelcase */
import type {
  DutyInstrument,
  NoiseInstrument,
  WaveInstrument,
} from "store/features/trackerDocument/trackerDocumentTypes";
import { PatternCell } from "./song/PatternCell";
import { Song } from "./song/Song";
import { SubPatternCell } from "./song/SubPatternCell";
import { noteGBDKDefines } from "shared/lib/music/constants";

interface InstrumentMap {
  [index: number]: number;
}

interface InstrumentData {
  idx: number;
  type: number;
  name: string;
  length: number;
  length_enabled: number;
  initial_volume: number;
  volume_sweep_amount: number;
  freq_sweep_time: number;
  freq_sweep_shift: number;
  duty: number;
  wave_output_level: number;
  wave_waveform_index: number;
  subpattern_enabled: number;
  subpattern: SubPatternCell[];
  noise_counter_step: number;
  noise_macro: number[];
}

export const loadUGESong = (data: ArrayBuffer): Song | null => {
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

  const song = new Song();

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

  const instrument_count = version < 3 ? 15 : 45;

  const instrumentData: Array<InstrumentData> = [];
  for (let n = 0; n < instrument_count; n++) {
    const type = readUint32();
    const name = readText();

    const length = readUint32();
    const length_enabled = readUint8();
    let initial_volume = readUint8();
    if (initial_volume > 15) {
      initial_volume = 15; // ??? bug in the song files?
    }
    const volume_direction = readUint32();
    let volume_sweep_amount = readUint8();
    if (volume_sweep_amount !== 0) {
      volume_sweep_amount = 8 - volume_sweep_amount;
    }
    if (volume_direction) {
      volume_sweep_amount = -volume_sweep_amount;
    }

    const freq_sweep_time = readUint32();
    const freq_sweep_direction = readUint32();
    let freq_sweep_shift = readUint32();
    if (freq_sweep_direction) {
      freq_sweep_shift = -freq_sweep_shift;
    }

    const duty = readUint8();

    const wave_output_level = readUint32();
    const wave_waveform_index = readUint32();

    let subpattern_enabled = 0;
    let noise_counter_step = 0;

    const subpattern: SubPatternCell[] = [];
    if (version >= 6) {
      noise_counter_step = readUint32();

      subpattern_enabled = readUint8();

      for (let m = 0; m < 64; m++) {
        const note = readUint32();
        offset += 4; // unused uint32 field. increase offset by 4.
        const jump = readUint32();
        const effectcode = readUint32();
        const effectparam = readUint8();

        subpattern.push({
          note: note === 90 ? null : note,
          jump,
          effectcode: effectcode === 0 && effectparam === 0 ? null : effectcode,
          effectparam:
            effectcode === 0 && effectparam === 0 ? null : effectparam,
        });
      }
    }

    const noise_macro = [];
    if (version < 6) {
      offset += 4; // unused uint32 field. increase offset by 4.
      noise_counter_step = readUint32();
      offset += 4; // unused uint32 field. increase offset by 4.
      if (version >= 4) {
        for (let n = 0; n < 6; n++) {
          const uint8ref = readUint8();
          const int8ref = uint8ref > 0x7f ? uint8ref - 0x100 : uint8ref;
          noise_macro.push(int8ref);
        }
      }
    }

    instrumentData.push({
      idx: n,
      type,
      name,
      length,
      length_enabled,
      initial_volume,
      volume_sweep_amount,
      freq_sweep_time,
      freq_sweep_shift,
      duty,
      wave_output_level,
      wave_waveform_index,
      subpattern_enabled,
      subpattern,
      noise_counter_step,
      noise_macro,
    });
  }

  for (let n = 0; n < 16; n++) {
    song.waves.push(Uint8Array.from(uint8data.slice(offset, offset + 32)));
    offset += 32;
    if (version < 3) offset += 1; // older versions have an off-by-one error
  }

  song.ticks_per_row = readUint32();

  if (version >= 6) {
    song.timer_enabled = readUint8() !== 0;
    song.timer_divider = readUint32();
  }

  const pattern_count = new Uint32Array(data.slice(offset, offset + 4))[0];
  if (offset + pattern_count * 13 * 64 > data.byteLength) {
    throw new Error(`Song has too many patterns (${pattern_count})`);
  }
  offset += 4;
  const patterns = [];
  for (let n = 0; n < pattern_count; n++) {
    let patternId = 0;
    const pattern = [];
    if (version >= 5) {
      patternId = readUint32();
    } else {
      patternId = n;
    }
    for (let m = 0; m < 64; m++) {
      if (version < 6) {
        const [note, instrument, effectcode] = new Int32Array(
          data.slice(offset, offset + 3 * 4),
        );
        offset += 3 * 4;
        const effectparam = readUint8();

        pattern.push([note, instrument, effectcode, effectparam]);
      } else if (version >= 6) {
        const [note, instrument, _unused, effectcode] = new Int32Array(
          data.slice(offset, offset + 4 * 4),
        );
        offset += 4 * 4;
        const effectparam = readUint8();

        pattern.push([note, instrument, effectcode, effectparam]);
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

  const orders = [];
  for (let n = 0; n < 4; n++) {
    const order_count = readUint32(); // The amount of pattern orders stored in the file has an off-by-one.
    orders.push(
      new Uint32Array(data.slice(offset, offset + 4 * (order_count - 1))),
    );
    offset += 4 * order_count;
  }
  // TODO: If version > 1 then custom routines follow.

  // Add instruments
  const duty_instrument_mapping: InstrumentMap = {};
  const wave_instrument_mapping: InstrumentMap = {};
  const noise_instrument_mapping: InstrumentMap = {};
  instrumentData.forEach((instrument: InstrumentData) => {
    const {
      idx,
      type,
      name,
      length,
      length_enabled,
      initial_volume,
      volume_sweep_amount,
      freq_sweep_time,
      freq_sweep_shift,
      duty,
      wave_output_level,
      wave_waveform_index,
      subpattern_enabled,
      subpattern,
      noise_counter_step,
      noise_macro,
    } = instrument;

    if (type === 0) {
      const instr = {} as DutyInstrument;

      if (length_enabled) {
        instr.length = 64 - length;
      } else {
        instr.length = null;
      }

      instr.name = name;
      instr.duty_cycle = duty;
      instr.initial_volume = initial_volume;
      instr.volume_sweep_change = volume_sweep_amount;

      instr.frequency_sweep_time = freq_sweep_time;
      instr.frequency_sweep_shift = freq_sweep_shift;

      if (version >= 6) {
        instr.subpattern_enabled = subpattern_enabled !== 0;
        instr.subpattern = subpattern;
      } else {
        instr.subpattern_enabled = false;
        instr.subpattern = [...Array(64)].map(() => new SubPatternCell());
      }

      duty_instrument_mapping[(idx % 15) + 1] = song.duty_instruments.length;
      song.addDutyInstrument(instr);
    } else if (type === 1) {
      const instr = {} as WaveInstrument;

      if (length_enabled) {
        instr.length = 256 - length;
      } else {
        instr.length = null;
      }

      instr.name = name;
      instr.volume = wave_output_level;
      instr.wave_index = wave_waveform_index;

      if (version >= 6) {
        instr.subpattern_enabled = subpattern_enabled !== 0;
        instr.subpattern = subpattern;
      } else {
        instr.subpattern_enabled = false;
        instr.subpattern = [...Array(64)].map(() => new SubPatternCell());
      }

      wave_instrument_mapping[(idx % 15) + 1] = song.wave_instruments.length;
      song.addWaveInstrument(instr);
    } else if (type === 2) {
      const instr = {} as NoiseInstrument;

      if (length_enabled) {
        instr.length = 64 - length;
      } else {
        instr.length = null;
      }

      instr.name = name;
      instr.initial_volume = initial_volume;
      instr.volume_sweep_change = volume_sweep_amount;

      instr.bit_count = noise_counter_step ? 7 : 15;
      if (version < 6) {
        if (version >= 4) {
          instr.noise_macro = noise_macro;
        } else {
          instr.noise_macro = [0, 0, 0, 0, 0, 0];
        }
      }

      if (version >= 6) {
        instr.subpattern_enabled = subpattern_enabled !== 0;
        instr.subpattern = subpattern;
      } else {
        /* 
          Older versions of the uge format had a noise macro field for the noise instrument that needs to be migrated to the subpattern.
        */
        if (noise_macro.length === 0) {
          // if noise macro is empty create an empty subpattern and disable
          // subpattern for this instrument
          instr.subpattern_enabled = false;
          instr.subpattern = [...Array(64)].map(() => new SubPatternCell());
        } else {
          // if noise macro is not empty migrate to the subpattern
          instr.subpattern_enabled = true;
          instr.subpattern = subpatternFromNoiseMacro(
            instr.noise_macro ?? [],
            song.ticks_per_row,
          );
        }
      }

      noise_instrument_mapping[(idx % 15) + 1] = song.noise_instruments.length;
      song.addNoiseInstrument(instr);
    } else {
      throw Error(`Invalid instrument type ${type} [${idx}, "${name}"]`);
    }
  });

  // Create proper flat patterns
  for (let n = 0; n < orders[0].length; n++) {
    const pattern: PatternCell[][] = [];
    for (let m = 0; m < 64; m++) {
      const row: PatternCell[] = [];
      for (let track = 0; track < 4; track++) {
        const cellData: number[] = patterns[orders[track][n]][m];
        const [note, instrument, effectcode, effectparam] = cellData;
        const cell = new PatternCell();
        if (note !== 90) cell.note = note;
        if (instrument !== 0) {
          let mapping: InstrumentMap = {};
          if (track < 2) mapping = duty_instrument_mapping;
          if (track === 2) mapping = wave_instrument_mapping;
          if (track === 3) mapping = noise_instrument_mapping;
          if (instrument in mapping) cell.instrument = mapping[instrument];
        }
        if (effectcode !== 0 || effectparam !== 0) {
          cell.effectcode = effectcode;
          cell.effectparam = effectparam;
        }
        row.push(cell);
      }
      pattern.push(row);
    }
    song.patterns.push(pattern);
    let added = false;
    for (let idx = 0; idx < song.patterns.length - 1; idx++) {
      if (
        comparePatterns(
          song.patterns[idx],
          song.patterns[song.patterns.length - 1],
        )
      ) {
        song.sequence.push(idx);
        song.patterns.pop();
        added = true;
      }
    }
    if (!added) song.sequence.push(song.patterns.length - 1);
  }

  // TODO: Remove unused instruments, unused waves, and deduplicate patterns.
  // for (let idx = 0; idx < song.duty_instruments.length;) {
  //   if (!song.usesInstrument("duty", idx))
  //     song.removeInstrument("duty", idx);
  //   else
  //     idx += 1;
  // }
  // for (let idx = 0; idx < song.wave_instruments.length;) {
  //   if (!song.usesInstrument("wave", idx))
  //     song.removeInstrument("wave", idx);
  //   else
  //     idx += 1;
  // }
  // for (let idx = 0; idx < song.noise_instruments.length;) {
  //   if (!song.usesInstrument("noise", idx))
  //     song.removeInstrument("noise", idx);
  //   else
  //     idx += 1;
  // }

  return song;
};

export const saveUGESong = (song: Song): ArrayBuffer => {
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
    addInt8(i.subpattern_enabled ? 1 : 0);
    for (let n = 0; n < 64; n++) {
      const subpattern = i.subpattern[n];
      addUint32(subpattern.note ?? 90);
      addUint32(0);
      addUint32(subpattern.jump ?? 0);
      addUint32(subpattern.effectcode ?? 0);
      addUint8(subpattern.effectparam ?? 0);
    }
  }
  function addDutyInstrument(type: number, i: DutyInstrument) {
    addUint32(type);

    addShortString(i.name || "");
    addUint32(i.length !== null ? 64 - i.length : 0);
    addUint8(i.length === null ? 0 : 1);
    addUint8(i.initial_volume);
    addUint32(i.volume_sweep_change < 0 ? 1 : 0);
    addUint8(
      i.volume_sweep_change !== 0 ? 8 - Math.abs(i.volume_sweep_change) : 0,
    );

    addUint32(i.frequency_sweep_time);
    addUint32(i.frequency_sweep_shift < 0 ? 1 : 0);
    addUint32(Math.abs(i.frequency_sweep_shift));

    addUint8(i.duty_cycle);

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
    addUint32(i.wave_index);

    addUint32(0);

    addSubpattern(i);
  }

  function addNoiseInstrument(type: number, i: NoiseInstrument) {
    addUint32(type);

    addShortString(i.name || "");
    addUint32(i.length !== null ? 64 - i.length : 0);
    addUint8(i.length === null ? 0 : 1);
    addUint8(i.initial_volume);
    addUint32(i.volume_sweep_change < 0 ? 1 : 0);
    addUint8(
      i.volume_sweep_change !== 0 ? 8 - Math.abs(i.volume_sweep_change) : 0,
    );

    addUint32(0);
    addUint32(0);
    addUint32(0);

    addUint8(0);

    addUint32(0);
    addUint32(0);

    addUint32(i.bit_count === 7 ? 1 : 0);

    addSubpattern(i);
  }

  addUint32(6); // version
  addShortString(song.name);
  addShortString(song.artist);
  addShortString(song.comment);

  for (let n = 0; n < 15; n++) {
    addDutyInstrument(0, song.duty_instruments[n] || {});
  }
  for (let n = 0; n < 15; n++) {
    addWaveInstrument(1, song.wave_instruments[n] || {});
  }
  for (let n = 0; n < 15; n++) {
    addNoiseInstrument(2, song.noise_instruments[n] || {});
  }
  for (let n = 0; n < 16; n++) {
    for (let m = 0; m < 32; m++) {
      addUint8(song.waves[n] ? song.waves[n][m] : 0);
    }
  }
  addUint32(song.ticks_per_row);

  addInt8(song.timer_enabled ? 1 : 0);

  addUint32(song.timer_divider);

  addUint32(song.patterns.length * 4);
  let patternKey = 0;
  for (const pattern of song.patterns) {
    for (let track = 0; track < 4; track++) {
      addUint32(patternKey++);
      for (let m = 0; m < 64; m++) {
        const t = pattern[m][track];
        addUint32(t.note === null ? 90 : t.note);
        addUint32(t.instrument === null ? 0 : t.instrument + 1);
        addUint32(0);
        addUint32(t.effectcode === null ? 0 : t.effectcode);
        addUint8(t.effectparam === null ? 0 : t.effectparam);
      }
    }
  }
  for (let track = 0; track < 4; track++) {
    addUint32(song.sequence.length + 1); //amount of "orders" in a uge file has an off-by-one
    for (const i of song.sequence) {
      addUint32(i * 4 + track);
    }
    addUint32(0); // add the off-by-one error
  }
  for (let n = 0; n < 16; n++) {
    addUint32(0); //Add empty routines
  }

  return buffer.slice(0, idx);
};

const comparePatterns = function (a: PatternCell[][], b: PatternCell[][]) {
  if (a.length !== b.length) return false;
  for (let idx = 0; idx < a.length; idx++) {
    if (!patternEqual(a[idx], b[idx])) return false;
  }
  return true;
};

const patternEqual = function (a: PatternCell[], b: PatternCell[]) {
  if (a.length !== b.length) return false;
  for (let idx = 0; idx < a.length; idx++) {
    if (a[idx].note !== b[idx].note) return false;
    if (a[idx].instrument !== b[idx].instrument) return false;
    if (a[idx].effectcode !== b[idx].effectcode) return false;
    if (a[idx].effectparam !== b[idx].effectparam) return false;
  }
  return true;
};

export const exportToC = (song: Song, trackName: string): string => {
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
      .map((n) => `song_pattern_${pattern_map[`${n}, ${track}`]}`)
      .join(", ");
  };

  const formatPatternCell = function (cell: PatternCell) {
    const note = cell.note !== null ? noteGBDKDefines[cell.note] : "___";
    let instrument = 0;
    let effect_code = 0;
    let effect_param = 0;
    if (cell.instrument !== null) instrument = cell.instrument + 1;
    if (cell.effectcode !== null) {
      effect_code = cell.effectcode;
      effect_param = cell.effectparam || 0;
    }
    return `DN(${note}, ${instrument}, ${decHex(
      (effect_code << 8) | effect_param,
      3,
    )})`;
  };

  const formatSubpattern = function (
    instr: DutyInstrument | WaveInstrument | NoiseInstrument,
    type: "duty" | "wave" | "noise",
  ) {
    if (instr.subpattern_enabled) {
      data += `static const unsigned char ${type}_${instr.index}_subpattern[] = {\n`;
      for (let idx = 0; idx < 32; idx++) {
        const cell = instr.subpattern[idx];
        data += `    ${formatSubPatternCell(cell, idx === 32 - 1)},\n`;
      }
      data += "};\n";
    }
  };
  const formatSubPatternCell = function (
    cell: SubPatternCell,
    isLast: boolean,
  ) {
    const note = cell.note ?? "___";
    const jump = cell.jump !== null && isLast ? 1 : (cell.jump ?? 0);
    let effect_code = 0;
    let effect_param = 0;
    if (cell.effectcode !== null) {
      effect_code = cell.effectcode;
      effect_param = cell.effectparam || 0;
    }
    return `DN(${note}, ${jump}, ${decHex(
      (effect_code << 8) | effect_param,
      3,
    )})`;
  };

  const formatDutyInstrument = function (instr: DutyInstrument) {
    const sweep =
      (instr.frequency_sweep_time << 4) |
      (instr.frequency_sweep_shift < 0 ? 0x08 : 0x00) |
      Math.abs(instr.frequency_sweep_shift);
    const len_duty =
      (instr.duty_cycle << 6) |
      ((instr.length !== null ? 64 - instr.length : 0) & 0x3f);
    let envelope =
      (instr.initial_volume << 4) |
      (instr.volume_sweep_change > 0 ? 0x08 : 0x00);
    if (instr.volume_sweep_change !== 0) {
      envelope |= 8 - Math.abs(instr.volume_sweep_change);
    }
    let subpatternRef: 0 | string = 0;
    if (instr.subpattern_enabled) {
      subpatternRef = `duty_${instr.index}_subpattern`;
    }
    const highmask = 0x80 | (instr.length !== null ? 0x40 : 0);

    return `{ ${decHex(sweep)}, ${decHex(len_duty)}, ${decHex(
      envelope,
    )}, ${subpatternRef}, ${decHex(highmask)} }`;
  };

  const formatWaveInstrument = function (instr: WaveInstrument) {
    const length = (instr.length !== null ? 256 - instr.length : 0) & 0xff;
    const volume = instr.volume << 5;
    const waveform = instr.wave_index;
    let subpatternRef: 0 | string = 0;
    if (instr.subpattern_enabled) {
      subpatternRef = `wave_${instr.index}_subpattern`;
    }
    const highmask = 0x80 | (instr.length !== null ? 0x40 : 0);

    return `{ ${decHex(length)}, ${decHex(volume)}, ${decHex(
      waveform,
    )}, ${subpatternRef}, ${decHex(highmask)} }`;
  };

  const formatNoiseInstrument = function (instr: NoiseInstrument) {
    let envelope =
      (instr.initial_volume << 4) |
      (instr.volume_sweep_change > 0 ? 0x08 : 0x00);
    if (instr.volume_sweep_change !== 0)
      envelope |= 8 - Math.abs(instr.volume_sweep_change);
    let subpatternRef: 0 | string = 0;
    if (instr.subpattern_enabled) {
      subpatternRef = `noise_${instr.index}_subpattern`;
    }
    let highmask = (instr.length !== null ? 64 - instr.length : 0) & 0x3f;
    if (instr.length !== null) highmask |= 0x40;
    if (instr.bit_count === 7) highmask |= 0x80;

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
  const pattern_map: { [key: string]: number } = {};

  for (let n = 0; n < song.patterns.length; n++) {
    const source_pattern = song.patterns[n];
    for (let track = 0; track < 4; track++) {
      const target_pattern = [];
      for (let m = 0; m < source_pattern.length; m++) {
        target_pattern.push(source_pattern[m][track]);
      }

      const idx = findPattern(target_pattern);
      if (idx !== null) {
        pattern_map[`${n}, ${track}`] = idx;
      } else {
        pattern_map[`${n}, ${track}`] = patterns.length;
        patterns.push(target_pattern);
      }
    }
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
  for (const instr of song.duty_instruments) {
    formatSubpattern(instr, "duty");
  }
  for (const instr of song.wave_instruments) {
    formatSubpattern(instr, "wave");
  }
  for (const instr of song.noise_instruments) {
    formatSubpattern(instr, "noise");
  }
  for (let track = 0; track < 4; track++)
    data += `static const unsigned char* const order${
      track + 1
    }[] = {${getSequenceMappingFor(track)}};\n`;
  data += "static const hUGEDutyInstr_t duty_instruments[] = {\n";
  for (const instr of song.duty_instruments) {
    data += `    ${formatDutyInstrument(instr)},\n`;
  }
  data += "};\n";
  data += "static const hUGEWaveInstr_t wave_instruments[] = {\n";
  for (const instr of song.wave_instruments) {
    data += `    ${formatWaveInstrument(instr)},\n`;
  }
  data += "};\n";
  data += "static const hUGENoiseInstr_t noise_instruments[] = {\n";
  for (const instr of song.noise_instruments) {
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
    ${song.ticks_per_row},
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
  noise_macro: number[],
  ticks_per_row: number,
) {
  const subpattern = [...Array(64)].map(() => new SubPatternCell());
  for (let n = 0; n < 6; n++) {
    subpattern[n + 1].note = noise_macro[n] + 36;
  }
  const wrapPoint = Math.min(ticks_per_row, 7);
  subpattern[wrapPoint - 1].jump = wrapPoint;
  return subpattern;
};
