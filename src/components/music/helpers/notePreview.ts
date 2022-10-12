import { InstrumentType } from "store/features/editor/editorState";
import {
  DutyInstrument,
  WaveInstrument,
  NoiseInstrument,
} from "store/features/trackerDocument/trackerDocumentTypes";
import emulator from "./emulator";
import {
  note2freq,
  NR12,
  NR22,
  NR30,
  NR42,
  NR43,
  NR41,
  NR44,
  NR31,
  NR32,
  NR33,
  NR34,
  NR10,
  NR11,
  NR13,
  NR14,
  NR21,
  NR23,
  NR24,
  AUD3_WAVE_RAM,
} from "./music_constants";

let previewTimeoutId: number | null = null;

export const playNotePreview = (
  note: number,
  type: InstrumentType,
  instrument: DutyInstrument | WaveInstrument | NoiseInstrument,
  square2: boolean,
  waves: Uint8Array[] = []
) => {
  console.log(note, instrument, square2);

  switch (type) {
    case "duty":
      previewDutyInstrument(note, instrument as DutyInstrument, square2);
      break;
    case "wave":
      previewWaveInstrument(note, instrument as WaveInstrument, waves);
      break;
    case "noise":
      previewNoiseInstrument(note, instrument as NoiseInstrument);
      break;
    default:
      break;
  }

  if (previewTimeoutId) {
    clearTimeout(previewTimeoutId);
  }
  previewTimeoutId = setTimeout(() => {
    emulator.writeMem(NR12, 0);
    emulator.writeMem(NR22, 0);
    emulator.writeMem(NR30, 0);
    emulator.writeMem(NR42, 0);
  }, 2000);
};

function previewDutyInstrument(
  note: number,
  instrument: DutyInstrument,
  square2: boolean
) {
  const noteFreq = note2freq[note];

  if (!square2) {
    const regs = {
      NR10:
        "0" +
        bitpack(instrument.frequency_sweep_time, 3) +
        (instrument.frequency_sweep_shift < 0 ? 1 : 0) +
        bitpack(Math.abs(instrument.frequency_sweep_shift), 3),
      NR11:
        bitpack(instrument.duty_cycle, 2) +
        bitpack(
          instrument.length !== null && instrument.length !== 0
            ? 64 - instrument.length
            : 0,
          6
        ),
      NR12:
        bitpack(instrument.initial_volume, 4) +
        (instrument.volume_sweep_change > 0 ? 1 : 0) +
        bitpack(
          instrument.volume_sweep_change !== 0
            ? 8 - Math.abs(instrument.volume_sweep_change)
            : 0,
          3
        ),
      NR13: bitpack(noteFreq & 0b11111111, 8),
      NR14:
        "1" + // Initial
        (instrument.length !== null ? 1 : 0) +
        "000" +
        bitpack((noteFreq & 0b0000011100000000) >> 8, 3),
    };

    console.log("-------------");
    console.log(`NR10`, regs.NR10, parseInt(regs.NR10, 2));
    console.log(`NR11`, regs.NR11, parseInt(regs.NR11, 2));
    console.log(`NR12`, regs.NR12, parseInt(regs.NR12, 2));
    console.log(`NR13`, regs.NR13, parseInt(regs.NR13, 2));
    console.log(`NR14`, regs.NR14, parseInt(regs.NR14, 2));
    console.log("=============");

    emulator.writeMem(NR10, parseInt(regs.NR10, 2));
    emulator.writeMem(NR11, parseInt(regs.NR11, 2));
    emulator.writeMem(NR12, parseInt(regs.NR12, 2));
    emulator.writeMem(NR13, parseInt(regs.NR13, 2));
    emulator.writeMem(NR14, parseInt(regs.NR14, 2));
  } else {
    const regs = {
      NR21:
        bitpack(instrument.duty_cycle, 2) +
        bitpack(
          instrument.length !== null && instrument.length !== 0
            ? 64 - instrument.length
            : 0,
          6
        ),
      NR22:
        bitpack(instrument.initial_volume, 4) +
        (instrument.volume_sweep_change > 0 ? 1 : 0) +
        bitpack(
          instrument.volume_sweep_change !== 0
            ? 8 - Math.abs(instrument.volume_sweep_change)
            : 0,
          3
        ),
      NR23: bitpack(noteFreq & 0b11111111, 8),
      NR24:
        "1" + // Initial
        (instrument.length !== null ? 1 : 0) +
        "000" +
        bitpack((noteFreq & 0b0000011100000000) >> 8, 3),
    };

    console.log("-------------");
    console.log(`NR21`, regs.NR21, parseInt(regs.NR21, 2));
    console.log(`NR22`, regs.NR22, parseInt(regs.NR22, 2));
    console.log(`NR23`, regs.NR23, parseInt(regs.NR23, 2));
    console.log(`NR24`, regs.NR24, parseInt(regs.NR24, 2));
    console.log("=============");

    emulator.writeMem(NR21, parseInt(regs.NR21, 2));
    emulator.writeMem(NR22, parseInt(regs.NR22, 2));
    emulator.writeMem(NR23, parseInt(regs.NR23, 2));
    emulator.writeMem(NR24, parseInt(regs.NR24, 2));
  }
}

function previewWaveInstrument(
  note: number,
  instrument: WaveInstrument,
  waves: Uint8Array[]
) {
  const noteFreq = note2freq[note];

  const wave = waves[instrument.wave_index];
  for (let idx = 0; idx < 16; idx++) {
    emulator.writeMem(
      AUD3_WAVE_RAM + idx,
      (wave[idx * 2] << 4) | wave[idx * 2 + 1]
    );
  }

  const regs = {
    NR30: "1" + bitpack(0, 7),
    NR31: bitpack(
      (instrument.length !== null ? 256 - instrument.length : 0) & 0xff,
      8
    ),
    NR32: "00" + bitpack(instrument.volume, 2) + "00000",
    NR33: bitpack(noteFreq & 0b11111111, 8),
    NR34:
      "1" + // Initial
      (instrument.length !== null ? 1 : 0) +
      "000" +
      bitpack((noteFreq & 0b0000011100000000) >> 8, 3),
  };

  console.log("-------------");
  console.log(`NR30`, regs.NR30, parseInt(regs.NR30, 2));
  console.log(`NR31`, regs.NR31, parseInt(regs.NR31, 2));
  console.log(`NR32`, regs.NR32, parseInt(regs.NR32, 2));
  console.log(`NR33`, regs.NR33, parseInt(regs.NR33, 2));
  console.log(`NR34`, regs.NR34, parseInt(regs.NR34, 2));
  console.log("=============");

  emulator.writeMem(NR30, parseInt(regs.NR30, 2));
  emulator.writeMem(NR31, parseInt(regs.NR31, 2));
  emulator.writeMem(NR32, parseInt(regs.NR32, 2));
  emulator.writeMem(NR33, parseInt(regs.NR33, 2));
  emulator.writeMem(NR34, parseInt(regs.NR34, 2));
  return regs;
}

function previewNoiseInstrument(note: number, instrument: NoiseInstrument) {
  const regs = {
    NR41:
      "00" +
      bitpack(instrument.length !== null ? 64 - instrument.length : 0, 6),
    NR42:
      bitpack(instrument.initial_volume, 4) +
      (instrument.volume_sweep_change > 0 ? 1 : 0) +
      bitpack(
        instrument.volume_sweep_change !== 0
          ? 8 - Math.abs(instrument.volume_sweep_change)
          : 0,
        3
      ),
    NR43: bitpack(
      note2noise(note + instrument.noise_macro[0]) +
        (instrument.bit_count === 7 ? 8 : 0),
      8
    ),
    NR44:
      "1" + // Initial
      (instrument.length !== null ? 1 : 0) +
      "000000",
  };

  emulator.step("frame");
  let noiseStep = 0;
  const noiseTimer = setInterval(() => {
    if (noiseStep > 5) {
      clearInterval(noiseTimer);
      return;
    }
    console.log("noise macro step = " + noiseStep);
    emulator.writeMem(
      NR43,
      note2noise(note + instrument.noise_macro[noiseStep]) +
        (instrument.bit_count === 7 ? 8 : 0)
    );
    noiseStep++;
  }, 1000 / 64);

  console.log("-------------");
  console.log(`NR41`, regs.NR41, parseInt(regs.NR41, 2));
  console.log(`NR42`, regs.NR42, parseInt(regs.NR42, 2));
  console.log(`NR43`, regs.NR43, parseInt(regs.NR43, 2));
  console.log(`NR44`, regs.NR44, parseInt(regs.NR44, 2));
  console.log("=============");

  emulator.writeMem(NR41, parseInt(regs.NR41, 2));
  emulator.writeMem(NR42, parseInt(regs.NR42, 2));
  emulator.writeMem(NR43, parseInt(regs.NR43, 2));
  emulator.writeMem(NR44, parseInt(regs.NR44, 2));
}

const bitpack = (value: number, bitResolution: number): string => {
  const bitsString = Math.abs(value || 0).toString(2);

  let missingValues = "";
  for (let i = 0; i < bitResolution - bitsString.length; i++) {
    missingValues = missingValues + "0";
  }

  return missingValues + bitsString.slice(0, bitResolution);
};

const note2noise = (note: number) => {
  // https://docs.google.com/spreadsheets/d/1O9OTAHgLk1SUt972w88uVHp44w7HKEbS/edit#gid=75028951
  // if A > 7 then begin
  //   B := (A-4) div 4;
  //   C := (A mod 4)+4;
  //   A := (C or (B shl 4))
  // end;
  const pitch = 64 > note ? 63 - note : 192 + note;
  return pitch > 7 ? (((pitch - 4) >> 2) << 4) + (pitch & 3) + 4 : pitch;
};
