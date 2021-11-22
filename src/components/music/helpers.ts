import { Song } from "lib/helpers/uge/song/Song";
import { InstrumentType } from "store/features/editor/editorState";

export const getInstrumentTypeByChannel = (
  channel: number
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
