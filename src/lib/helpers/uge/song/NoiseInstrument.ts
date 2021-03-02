export class NoiseInstrument {
  index: number;
  name: string;
  length: number | null;
  initial_volume: number;
  volume_sweep_change: number;
  shift_clock_mask: number;
  dividing_ratio: number;
  bit_count: number;

  constructor(name: string) {
    this.index = 0;

    this.name = name;
    this.length = null;

    this.initial_volume = 15;
    this.volume_sweep_change = 0;

    this.shift_clock_mask = 0;
    this.dividing_ratio = 0;
    this.bit_count = 15;
  }

  fitsTrack(track: number) {
    return track == 3;
  }
}
