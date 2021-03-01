export class WaveInstrument {
  constructor(name) {
    this.name = name;
    this.length = null;

    this.volume = 1;
    this.wave_index = 0;
  }

  fitsTrack(track) {
    return track == 2;
  }
}
