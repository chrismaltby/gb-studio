/* eslint-disable camelcase */
import { SubPatternCell } from "shared/lib/uge/song/SubPatternCell";

export type DutyInstrument = {
  index: number;
  name: string;
  length: number | null;
  duty_cycle: number;
  initial_volume: number;
  volume_sweep_change: number;
  frequency_sweep_time: number;
  frequency_sweep_shift: number;
  subpattern_enabled: boolean;
  subpattern: SubPatternCell[];
};

export type WaveInstrument = {
  index: number;
  name: string;
  length: number | null;
  volume: number;
  wave_index: number;
  subpattern_enabled: boolean;
  subpattern: SubPatternCell[];
};

export type NoiseInstrument = {
  index: number;
  name: string;
  length: number | null;
  initial_volume: number;
  volume_sweep_change: number;
  dividing_ratio: number;
  bit_count: 7 | 15;
  /**
   * @deprecated noise macros aren't used starting uge v6
   */
  noise_macro?: number[];
  subpattern_enabled: boolean;
  subpattern: SubPatternCell[];
};
