export class DutyInstrument {
  index: number;
  name: string;
  length: number | null;
  duty_cycle: number;
  initial_volume: number;
  volume_sweep_change: number;
  frequency_sweep_time: number;
  frequency_sweep_shift: number;

  constructor(name: string) {
    this.index = 0;

    this.name = name;
    this.length = null;

    this.duty_cycle = 2;

    this.initial_volume = 15;
    this.volume_sweep_change = 0;

    this.frequency_sweep_time = 0;
    this.frequency_sweep_shift = 0;
  }

  fitsTrack(track: number) {
    return track == 0 || track == 1;
  }
}
