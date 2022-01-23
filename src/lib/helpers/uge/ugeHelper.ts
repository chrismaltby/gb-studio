/* eslint-disable camelcase */
import {
  DutyInstrument,
  NoiseInstrument,
  WaveInstrument,
} from "store/features/trackerDocument/trackerDocumentTypes";
import { PatternCell } from "./song/PatternCell";
import { Song } from "./song/Song";

// prettier-ignore
const noteConsts = ["C_3","Cs3","D_3","Ds3","E_3","F_3","Fs3","G_3","Gs3","A_3","As3","B_3","C_4","Cs4","D_4","Ds4","E_4","F_4","Fs4","G_4","Gs4","A_4","As4","B_4","C_5","Cs5","D_5","Ds5","E_5","F_5","Fs5","G_5","Gs5","A_5","As5","B_5","C_6","Cs6","D_6","Ds6","E_6","F_6","Fs6","G_6","Gs6","A_6","As6","B_6","C_7","Cs7","D_7","Ds7","E_7","F_7","Fs7","G_7","Gs7","A_7","As7","B_7","C_8","Cs8","D_8","Ds8","E_8","F_8","Fs8","G_8","Gs8","A_8","As8","B_8"];

interface InstrumentMap {
  [index: number]: number;
}

export const loadUGESong = (data: ArrayBuffer): Song | null => {
  console.log(data);
  const song = new Song();

  // TODO: Sanity checks on data.
  // TODO: Use `DataView` object instead of loads of Uint32Arrays
  let offset = 0;
  const version = new Uint32Array(data.slice(offset, offset + 4))[0];
  console.log(`! uge version: ${version}`);
  if (version < 0 || version > 5) {
    throw new Error(`UGE version ${version} is not supported by GB Studio`);
  }

  const uint8data = new Uint8Array(data);
  offset += 4;

  const td = new TextDecoder();
  song.name = td.decode(data.slice(offset + 1, offset + 1 + uint8data[offset]));
  offset += 256;
  song.artist = td.decode(
    data.slice(offset + 1, offset + 1 + uint8data[offset])
  );
  offset += 256;
  song.comment = td.decode(
    data.slice(offset + 1, offset + 1 + uint8data[offset])
  );
  offset += 256;

  const instrument_count = version < 3 ? 15 : 45;
  const duty_instrument_mapping: InstrumentMap = {};
  const wave_instrument_mapping: InstrumentMap = {};
  const noise_instrument_mapping: InstrumentMap = {};

  for (let n = 0; n < instrument_count; n++) {
    const type = new Uint32Array(data.slice(offset, offset + 4))[0];
    offset += 4;
    const name = td.decode(
      data.slice(offset + 1, offset + 1 + uint8data[offset])
    );
    offset += 256;

    let length = new Uint32Array(data.slice(offset, offset + 4))[0];
    offset += 4;
    const length_enabled = uint8data[offset];
    offset += 1;
    let initial_volume = uint8data[offset];
    if (initial_volume > 15) initial_volume = 15; // ??? bug in the song files?
    offset += 1;
    const volume_direction = uint8data[offset];
    offset += 4;
    let volume_sweep_amount = uint8data[offset];
    offset += 1;
    if (volume_sweep_amount !== 0)
      volume_sweep_amount = 8 - volume_sweep_amount;
    if (volume_direction) volume_sweep_amount = -volume_sweep_amount;

    const freq_sweep_time = new Uint32Array(data.slice(offset, offset + 4))[0];
    offset += 4;
    const freq_sweep_direction = new Uint32Array(
      data.slice(offset, offset + 4)
    )[0];
    offset += 4;
    let freq_sweep_shift = new Uint32Array(data.slice(offset, offset + 4))[0];
    offset += 4;
    if (freq_sweep_direction) {
      freq_sweep_shift = -freq_sweep_shift;
    }

    const duty = uint8data[offset];
    offset += 1;

    const wave_output_level = new Uint32Array(
      data.slice(offset, offset + 4)
    )[0];
    offset += 4;
    const wave_waveform_index = new Uint32Array(
      data.slice(offset, offset + 4)
    )[0];
    offset += 4;
    const noise_shift_clock_frequency = new Uint32Array(
      data.slice(offset, offset + 4)
    )[0];
    offset += 4;
    const noise_counter_step = new Uint32Array(
      data.slice(offset, offset + 4)
    )[0];
    offset += 4;
    const noise_dividing_ratio = new Uint32Array(
      data.slice(offset, offset + 4)
    )[0];
    offset += 4;
    const noise_macro = [];
    if (version >= 4) {
      for (let n = 0; n < 6; n++) {
        const uint8ref = uint8data[offset];
        const int8ref = uint8ref > 0x7f ? uint8ref - 0x100 : uint8ref;
        noise_macro.push(int8ref);
        offset += 1;
      }
    }

    if (type === 0) {
      length = 64 - length;

      const instr = {} as DutyInstrument;
      if (length_enabled) {
        instr.length = length;
      } else {
        instr.length = null;
      }

      instr.name = name;
      instr.duty_cycle = duty;
      instr.initial_volume = initial_volume;
      instr.volume_sweep_change = volume_sweep_amount;

      instr.frequency_sweep_time = freq_sweep_time;
      instr.frequency_sweep_shift = freq_sweep_shift;

      duty_instrument_mapping[(n % 15) + 1] = song.duty_instruments.length;
      song.addDutyInstrument(instr);
    } else if (type === 1) {
      length = 256 - length;

      const instr = {} as WaveInstrument;
      if (length_enabled) {
        instr.length = length;
      } else {
        instr.length = null;
      }

      instr.name = name;
      instr.volume = wave_output_level;
      instr.wave_index = wave_waveform_index;

      wave_instrument_mapping[(n % 15) + 1] = song.wave_instruments.length;
      song.addWaveInstrument(instr);
    } else if (type === 2) {
      length = 64 - length;

      const instr = {} as NoiseInstrument;
      if (length_enabled) {
        instr.length = length;
      } else {
        instr.length = null;
      }

      instr.name = name;
      instr.initial_volume = initial_volume;
      instr.volume_sweep_change = volume_sweep_amount;

      instr.shift_clock_mask = noise_shift_clock_frequency;
      instr.dividing_ratio = noise_dividing_ratio;
      instr.bit_count = noise_counter_step ? 7 : 15;
      if (version >= 4) {
        instr.noise_macro = noise_macro;
      } else {
        instr.noise_macro = [0, 0, 0, 0, 0, 0];
      }

      noise_instrument_mapping[(n % 15) + 1] = song.noise_instruments.length;
      song.addNoiseInstrument(instr);
    } else {
      throw Error(`Invalid instrument type ${type} [${n}, "${name}"]`);
    }
  }
  for (let n = 0; n < 16; n++) {
    song.waves.push(Uint8Array.from(uint8data.slice(offset, offset + 32)));
    offset += 32;
    if (version < 3) offset += 1; // older versions have an off-by-one error
  }

  song.ticks_per_row = new Uint32Array(data.slice(offset, offset + 4))[0];
  offset += 4;

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
      patternId = new Uint32Array(data.slice(offset, offset + 4))[0];
      offset += 4;
    } else {
      patternId = n;
    }
    for (let m = 0; m < 64; m++) {
      const [note, instrument, effectcode] = new Int32Array(
        data.slice(offset, offset + 12)
      );
      offset += 12;
      const effectparam = uint8data[offset];
      offset += 1;

      pattern.push([note, instrument, effectcode, effectparam]);
    }
    /*
     If there's a repeated pattern it probably means the song was saved
     with an old version of GB Studio (3.0.2 or earlier) that didn't saved the
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
    const order_count = new Uint32Array(data.slice(offset, offset + 4))[0]; // The amount of pattern orders stored in the file has an off-by-one.
    offset += 4;
    orders.push(
      new Uint32Array(data.slice(offset, offset + 4 * (order_count - 1)))
    );
    offset += 4 * order_count;
  }
  // TODO: If version > 1 then custom routines follow.

  // Create proper flat patterns
  for (let n = 0; n < orders[0].length; n++) {
    const pattern: PatternCell[][] = [];
    for (let m = 0; m < 64; m++) {
      const row: PatternCell[] = [];
      for (let track = 0; track < 4; track++) {
        const [note, instrument, effectcode, effectparam] =
          patterns[orders[track][n]][m];
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
          song.patterns[song.patterns.length - 1]
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

  console.log(song);
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
  function addDutyInstrument(type: number, i: DutyInstrument) {
    addUint32(type);

    addShortString(i.name || "");
    addUint32(i.length !== null ? 64 - i.length : 0);
    addUint8(i.length === null ? 0 : 1);
    addUint8(i.initial_volume);
    addUint32(i.volume_sweep_change < 0 ? 1 : 0);
    addUint8(
      i.volume_sweep_change !== 0 ? 8 - Math.abs(i.volume_sweep_change) : 0
    );

    addUint32(i.frequency_sweep_time);
    addUint32(i.frequency_sweep_shift < 0 ? 1 : 0);
    addUint32(Math.abs(i.frequency_sweep_shift));

    addUint8(i.duty_cycle);

    addUint32(0);
    addUint32(0);

    addUint32(0);
    addUint32(0);
    addUint32(0);

    for (let n = 0; n < 6; n++) {
      addInt8(0);
    }
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
    addUint32(0);
    addUint32(0);

    for (let n = 0; n < 6; n++) {
      addInt8(0);
    }
  }

  function addNoiseInstrument(type: number, i: NoiseInstrument) {
    addUint32(type);

    addShortString(i.name || "");
    addUint32(i.length !== null ? 64 - i.length : 0);
    addUint8(i.length === null ? 0 : 1);
    addUint8(i.initial_volume);
    addUint32(i.volume_sweep_change < 0 ? 1 : 0);
    addUint8(
      i.volume_sweep_change !== 0 ? 8 - Math.abs(i.volume_sweep_change) : 0
    );

    addUint32(0);
    addUint32(0);
    addUint32(0);

    addUint8(0);

    addUint32(0);
    addUint32(0);

    addUint32(0);
    addUint32(i.bit_count === 7 ? 1 : 0);
    addUint32(i.dividing_ratio);

    for (const v of i.noise_macro) {
      addInt8(v);
    }
  }

  addUint32(5); // version
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

  addUint32(song.patterns.length * 4);
  let patternKey = 0;
  for (const pattern of song.patterns) {
    for (let track = 0; track < 4; track++) {
      addUint32(patternKey++);
      for (let m = 0; m < 64; m++) {
        const t = pattern[m][track];
        addUint32(t.note === null ? 90 : t.note);
        addUint32(t.instrument === null ? 0 : t.instrument + 1);
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
    const note = cell.note !== null ? noteConsts[cell.note] : "___";
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
      3
    )})`;
  };

  const formatDutyInstrument = function (instr: DutyInstrument) {
    const nr10 =
      (instr.frequency_sweep_time << 4) |
      (instr.frequency_sweep_shift < 0 ? 0x08 : 0x00) |
      Math.abs(instr.frequency_sweep_shift);
    const nr11 =
      (instr.duty_cycle << 6) |
      ((instr.length !== null ? 64 - instr.length : 0) & 0x3f);
    let nr12 =
      (instr.initial_volume << 4) |
      (instr.volume_sweep_change > 0 ? 0x08 : 0x00);
    if (instr.volume_sweep_change !== 0) {
      nr12 |= 8 - Math.abs(instr.volume_sweep_change);
    }
    const nr14 = 0x80 | (instr.length !== null ? 0x40 : 0);
    return `${decHex(nr10)}, ${decHex(nr11)}, ${decHex(nr12)}, ${decHex(nr14)}`;
  };

  const formatWaveInstrument = function (instr: WaveInstrument) {
    const nr31 = (instr.length !== null ? instr.length : 0) & 0xff;
    const nr32 = instr.volume << 5;
    const wave_nr = instr.wave_index;
    const nr34 = 0x80 | (instr.length !== null ? 0x40 : 0);
    return `${decHex(nr31)}, ${decHex(nr32)}, ${decHex(wave_nr)}, ${decHex(
      nr34
    )}`;
  };

  const formatNoiseInstrument = function (instr: NoiseInstrument) {
    let param0 =
      (instr.initial_volume << 4) |
      (instr.volume_sweep_change > 0 ? 0x08 : 0x00);
    if (instr.volume_sweep_change !== 0)
      param0 |= 8 - Math.abs(instr.volume_sweep_change);
    let param1 = (instr.length !== null ? 64 - instr.length : 0) & 0x3f;
    if (instr.length !== null) param1 |= 0x40;
    if (instr.bit_count === 7) param1 |= 0x80;

    return `${decHex(param0)}, ${decHex(param1)}, 0, 0, 0, 0, 0, 0`;
  };

  const formatWave = function (wave: Uint8Array) {
    return Array.from(Array(16).keys(), (n) =>
      decHex((wave[n * 2] << 4) | wave[n * 2 + 1])
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
  for (let track = 0; track < 4; track++)
    data += `static const unsigned char* const order${
      track + 1
    }[] = {${getSequenceMappingFor(track)}};\n`;
  data += "static const unsigned char duty_instruments[] = {\n";
  for (const instr of song.duty_instruments) {
    data += `    ${formatDutyInstrument(instr)},\n`;
  }
  data += "};\n";
  data += "static const unsigned char wave_instruments[] = {\n";
  for (const instr of song.wave_instruments) {
    data += `    ${formatWaveInstrument(instr)},\n`;
  }
  data += "};\n";
  data += "static const unsigned char noise_instruments[] = {\n";
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
