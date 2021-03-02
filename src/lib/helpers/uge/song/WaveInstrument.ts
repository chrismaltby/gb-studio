export class WaveInstrument {
  name: any;
  length: number | null;
  volume: number;
  wave_index: number;
  index: number;

  constructor(name: string) {
    this.index = 0;

    this.name = name;
    this.length = null;

    this.volume = 1;
    this.wave_index = 0;
  }

  fitsTrack(track: number) {
    return track == 2;
  }
}
