export class NoiseInstrument {
  constructor(name) {
    this.name = name;
    this.length = null;

    this.initial_volume = 15;
    this.volume_sweep_change = 0;

    this.shift_clock_mask = 0;
    this.dividing_ratio = 0;
    this.bit_count = 15;
  }

  fitsTrack(track) {
    return track == 3;
  }
}
