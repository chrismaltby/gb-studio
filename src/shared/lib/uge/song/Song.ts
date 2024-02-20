/* eslint-disable camelcase */
import type {
  DutyInstrument,
  NoiseInstrument,
  WaveInstrument,
} from "store/features/trackerDocument/trackerDocumentTypes";
import { PatternCell } from "./PatternCell";

const LAST_VERSION = 6;

export class Song {
  version: number;
  name: string;
  artist: string;
  comment: string;
  filename: string;
  duty_instruments: DutyInstrument[];
  wave_instruments: WaveInstrument[];
  noise_instruments: NoiseInstrument[];
  waves: Uint8Array[];
  ticks_per_row: number;
  timer_enabled: boolean;
  timer_divider: number;
  patterns: PatternCell[][][];
  sequence: number[];

  constructor() {
    this.version = LAST_VERSION;
    this.name = "";
    this.artist = "";
    this.comment = "";
    this.filename = "song";

    this.duty_instruments = [];
    this.wave_instruments = [];
    this.noise_instruments = [];
    this.waves = [];
    this.ticks_per_row = 6;

    this.timer_enabled = false;
    this.timer_divider = 0;

    this.patterns = [];
    this.sequence = [];
  }

  addDutyInstrument(instrument: DutyInstrument) {
    const list = this.duty_instruments;
    instrument.index = list.length;
    list.push(instrument);
  }

  addWaveInstrument(instrument: WaveInstrument) {
    const list = this.wave_instruments;
    instrument.index = list.length;
    list.push(instrument);
  }

  addNoiseInstrument(instrument: NoiseInstrument) {
    const list = this.noise_instruments;
    instrument.index = list.length;
    list.push(instrument);
  }

  usesInstrument(type: string, index: number) {
    let cols: number[] = [];
    if (type === "duty") {
      cols = [0, 1];
    }
    if (type === "wave") {
      cols = [2];
    }
    if (type === "noise") {
      cols = [3];
    }

    for (const pattern of this.patterns) {
      for (const row of pattern) {
        for (const col of cols) {
          if (row[col].instrument === index) return true;
        }
      }
    }
    return false;
  }

  removeInstrument(type: string, index: number) {
    let list: (DutyInstrument | WaveInstrument | NoiseInstrument)[] = [];
    let cols: number[] = [];
    if (type === "duty") {
      list = this.duty_instruments;
      cols = [0, 1];
    }
    if (type === "wave") {
      list = this.wave_instruments;
      cols = [2];
    }
    if (type === "noise") {
      list = this.noise_instruments;
      cols = [3];
    }

    for (const pattern of this.patterns) {
      for (const row of pattern) {
        for (const col of cols) {
          const instrumentIndex = row[col].instrument;
          if (instrumentIndex) {
            if (instrumentIndex === index) {
              row[col].instrument = null;
            }
            if (instrumentIndex > index) {
              row[col].instrument = instrumentIndex - 1;
            }
          }
        }
      }
    }

    list.splice(index, 1);
    for (let idx = 0; idx < list.length; idx++) {
      list[idx].index = idx;
    }
  }
}
