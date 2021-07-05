/* eslint-disable camelcase */
import { PatternCell } from "lib/helpers/uge/song/PatternCell";

export type Song = {
  name: string;
  artist: string;
  comment: string;
  filename: string;
  duty_instruments: DutyInstrument[];
  wave_instruments: WaveInstrument[];
  noise_instruments: NoiseInstrument[];
  waves: Uint8Array[];
  ticks_per_row: number;
  patterns: PatternCell[][][];
  sequence: number[];
};

export type DutyInstrument = {
  index: number;
  name: string;
  length: number | null;
  duty_cycle: number;
  initial_volume: number;
  volume_sweep_change: number;
  frequency_sweep_time: number;
  frequency_sweep_shift: number;
};

export type WaveInstrument = {
  index: number;
  name: string;
  length: number | null;
  volume: number;
  wave_index: number;
};

export type NoiseInstrument = {
  index: number;
  name: string;
  length: number | null;
  initial_volume: number;
  volume_sweep_change: number;
  shift_clock_mask: number;
  dividing_ratio: number;
  bit_count: 7 | 15;
  noise_macro: number[];
};
