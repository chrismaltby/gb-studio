/* eslint-disable camelcase */
import {
  Song,
  PatternCell,
  SubPatternCell,
  DutyInstrument,
  WaveInstrument,
  NoiseInstrument,
} from "./types";

const LAST_VERSION = 6;

export const createPatternCell = (): PatternCell => {
  return {
    note: null,
    instrument: null,
    effectcode: null,
    effectparam: null,
  };
};

export const createSubPatternCell = (): SubPatternCell => {
  return {
    note: null,
    jump: null,
    effectcode: null,
    effectparam: null,
  };
};

export const createSong = (): Song => {
  return {
    version: LAST_VERSION,
    name: "",
    artist: "",
    comment: "",
    filename: "song",

    duty_instruments: [],
    wave_instruments: [],
    noise_instruments: [],
    waves: [],
    ticks_per_row: 6,

    timer_enabled: false,
    timer_divider: 0,

    patterns: [],
    sequence: [],
  };
};

export const addDutyInstrument = (song: Song, instrument: DutyInstrument) => {
  const list = song.duty_instruments;
  instrument.index = list.length;
  list.push(instrument);
};

export const addWaveInstrument = (song: Song, instrument: WaveInstrument) => {
  const list = song.wave_instruments;
  instrument.index = list.length;
  list.push(instrument);
};

export const addNoiseInstrument = (song: Song, instrument: NoiseInstrument) => {
  const list = song.noise_instruments;
  instrument.index = list.length;
  list.push(instrument);
};
