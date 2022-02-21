import { PatternCell } from "lib/helpers/uge/song/PatternCell";
import { Song } from "lib/helpers/uge/song/Song";
import { InstrumentType } from "store/features/editor/editorState";
import { noteNames } from "./helpers/music_constants";

type PatternCellKey = keyof PatternCell;

const patternCellFields: PatternCellKey[] = [
  "note",
  "instrument",
  "effectcode",
  "effectparam",
];

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

const patternCelltoString = (
  p: PatternCell,
  fields: PatternCellKey[] = ["note", "instrument", "effectcode", "effectparam"]
) => {
  return `|${renderNote(
    fields.includes("note") ? p.note : null
  )}${renderInstrument(
    fields.includes("instrument") ? p.instrument : null
  )}...${renderEffect(
    fields.includes("effectcode") ? p.effectcode : null
  )}${renderEffectParam(
    fields.includes("effectparam") ? p.effectparam : null
  )}`;
};

export const parsePatternToClipboard = (
  pattern: PatternCell[][],
  channelId?: number,
  selectedCells?: number[]
) => {
  let parsed: string[] = [];

  if (!selectedCells) {
    parsed = pattern.map((p) => {
      if (channelId !== undefined) {
        const row = p[channelId];
        return patternCelltoString(row);
      } else {
        return `${patternCelltoString(p[0])}${patternCelltoString(
          p[1]
        )}${patternCelltoString(p[2])}${patternCelltoString(p[3])}`;
      }
    });
  } else if (selectedCells.length > 0) {
    const sortedSelectedCells = [...selectedCells].sort((a, b) => a - b);
    console.log(selectedCells, sortedSelectedCells);
    for (
      let i = sortedSelectedCells[0];
      i <= sortedSelectedCells[sortedSelectedCells.length - 1];
      i++
    ) {
      if (channelId !== undefined) {
        if (selectedCells.indexOf(i) > -1) {
          parsed.push(patternCelltoString(pattern[i][channelId]));
        } else {
          parsed.push(patternCelltoString(new PatternCell()));
        }
      }
    }
  }

  return parsed.join("\n");
};

export const parsePatternFieldsToClipboard = (
  pattern: PatternCell[][],
  selectedFields: number[]
) => {
  const parsed: string[] = [];

  const w =
    (selectedFields[selectedFields.length - 1] - selectedFields[0]) % 16;
  const h = Math.floor(
    (selectedFields[selectedFields.length - 1] - selectedFields[0]) / 16
  );
  const firstRow = Math.floor(selectedFields[0] / 16);
  const firstColumn = selectedFields[0] % 16;

  for (let i = firstRow; i <= firstRow + h; i++) {
    let rowStr = "";
    for (
      let j = Math.floor(firstColumn / 4);
      j <= Math.floor((firstColumn + w) / 4);
      j++
    ) {
      const start = firstColumn - j * 4;
      const end = w + 1;
      rowStr += `${patternCelltoString(
        pattern[i][j],
        patternCellFields.slice(Math.max(0, start), start + end)
      )}`;
    }
    parsed.push(rowStr);
  }
  return parsed.join("\n");
};

export const parseClipboardToPattern = (clipboard: string) => {
  const strToInt = (string: string, radix: number, offset = 0) => {
    const int = parseInt(string, radix);
    return isNaN(int) ? null : int + offset;
  };
  const rows = clipboard.split("\n");
  const pattern = rows
    .filter((r) => r[0] === "|")
    .map((r, i) => {
      console.log(`ROW ${i}: `, r);
      if (r[0] === "|") {
        const channel = r.substring(1).trim().split("|");
        return channel.map((c, j) => {
          console.log(`CELL ${j}:`, c);
          const patternCell = new PatternCell();
          console.log(
            ">>>",
            c.substring(0, 3),
            c.substring(3, 5),
            c.substring(8, 9),
            c.substring(9, 11)
          );
          const note = noteNames.indexOf(c.substring(0, 3));
          patternCell.note = note === -1 ? null : note;
          patternCell.instrument = strToInt(c.substring(3, 5), 16, -1);
          patternCell.effectcode = strToInt(c.substring(8, 9), 16);
          patternCell.effectparam = strToInt(c.substring(9, 11), 16);
          return patternCell;
        });
      }
      throw new Error("Unsupported format");
    });

  return pattern;
};
