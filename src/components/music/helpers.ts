import { Song } from "shared/lib/uge/song/Song";
import { InstrumentType } from "store/features/editor/editorState";

export const getInstrumentTypeByChannel = (
  channel: number,
): InstrumentType | null => {
  switch (channel) {
    case 0:
    case 1:
      return "duty";
    case 2:
      return "wave";
    case 3:
      return "noise";
    default:
      return null;
  }
};

export const getInstrumentListByType = (song: Song, type: InstrumentType) => {
  switch (type) {
    case "duty":
      return song.duty_instruments;
    case "wave":
      return song.wave_instruments;
    case "noise":
      return song.noise_instruments;
    default:
      return [];
  }
};

export const noteName = [
  "C-",
  "C#",
  "D-",
  "D#",
  "E-",
  "F-",
  "F#",
  "G-",
  "G#",
  "A-",
  "A#",
  "B-",
];
export const renderNote = (note: number | null): string => {
  if (note === null) {
    return "...";
  }
  const octave = ~~(note / 12) + 3;
  return `${noteName[note % 12]}${octave}`;
};

export const renderInstrument = (instrument: number | null): string => {
  if (instrument === null) return "..";
  return (instrument + 1).toString().padStart(2, "0") || "..";
};

export const renderEffect = (effectcode: number | null): string => {
  return effectcode?.toString(16).toUpperCase() || ".";
};

export const renderEffectParam = (effectparam: number | null): string => {
  return effectparam?.toString(16).toUpperCase().padStart(2, "0") || "..";
};
