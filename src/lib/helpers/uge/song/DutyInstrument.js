export class DutyInstrument {
  constructor(name) {
    this.name = name;
    this.length = null;

    this.duty_cycle = 2;

    this.initial_volume = 15;
    this.volume_sweep_change = 0;

    this.frequency_sweep_time = 0;
    this.frequency_sweep_shift = 0;
  }

  fitsTrack(track) {
    return track == 0 || track == 1;
  }
}
