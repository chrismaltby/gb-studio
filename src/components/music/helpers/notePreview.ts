import API from "renderer/lib/api";
import {
  DutyInstrument,
  NoiseInstrument,
  WaveInstrument,
} from "shared/lib/uge/types";

export const playDutyNotePreview = (
  note: number,
  instrument: DutyInstrument,
  channel: 0 | 1,
  effectCode: number,
  effectParam: number,
) => {
  API.music.sendToMusicWindow({
    action: "preview",
    type: "duty",
    note,
    instrument,
    channel,
    effectCode,
    effectParam,
  });
};

export const playWaveNotePreview = (
  note: number,
  instrument: WaveInstrument,
  waveForm: Uint8Array,
  effectCode: number,
  effectParam: number,
) => {
  API.music.sendToMusicWindow({
    action: "preview",
    type: "wave",
    note: note,
    instrument,
    waveForm,
    effectCode,
    effectParam,
  });
};

export const playNoiseNotePreview = (
  note: number,
  instrument: NoiseInstrument,
  effectCode: number,
  effectParam: number,
) => {
  API.music.sendToMusicWindow({
    action: "preview",
    type: "noise",
    note: note,
    instrument,
    effectCode,
    effectParam,
  });
};
