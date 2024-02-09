import { PatternCell } from "renderer/lib/uge/song/PatternCell";
import { noteStringsForClipboard } from "./constants";
import { SubPatternCell } from "renderer/lib/uge/song/SubPatternCell";
import {
  renderNote,
  renderInstrument,
  renderEffect,
  renderEffectParam,
} from "./helpers";

export const NO_CHANGE_ON_PASTE = -9;

export type PatternCellKey = keyof PatternCell;
export const patternCellFields: PatternCellKey[] = [
  "note",
  "instrument",
  "effectcode",
  "effectparam",
];

export type SubPatternCellKey = keyof SubPatternCell;
export const subPatternCellFields: SubPatternCellKey[] = [
  "note",
  "jump",
  "effectcode",
  "effectparam",
];

// -- PATTERNS --

const patternCelltoString = (
  p: PatternCell,
  fields: PatternCellKey[] = ["note", "instrument", "effectcode", "effectparam"]
) => {
  return `|${fields.includes("note") ? renderNote(p.note) : "   "}${
    fields.includes("instrument") ? renderInstrument(p.instrument) : "  "
  }...${fields.includes("effectcode") ? renderEffect(p.effectcode) : " "}${
    fields.includes("effectparam") ? renderEffectParam(p.effectparam) : "  "
  }`;
};

export const parsePatternToClipboard = (
  pattern: PatternCell[][],
  channelId?: number,
  selectedCells?: number[]
) => {
  let parsed: string[] = [
    "GBStudio hUGETracker Piano format compatible with...",
    "ModPlug Tracker  XM",
  ];

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
  const parsed: string[] = [
    "GBStudio hUGETracker paste format compatible with...",
    "ModPlug Tracker  XM",
  ];

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
        const channel = r.substring(1).split("|");
        return channel.map((c, j) => {
          console.log(`CELL ${j}:`, c);
          const patternCell = new PatternCell();
          const cellString = [
            c.substring(0, 3),
            c.substring(3, 5),
            c.substring(8, 9),
            c.substring(9, 11),
          ];
          // Send NO_CHANGE_ON_PASTE to not change parameter when merging
          const note = noteStringsForClipboard.indexOf(cellString[0]);
          patternCell.note =
            cellString[0] !== "   "
              ? note === -1
                ? null
                : note
              : NO_CHANGE_ON_PASTE;
          patternCell.instrument =
            cellString[1] !== "  "
              ? strToInt(cellString[1], 10, -1)
              : NO_CHANGE_ON_PASTE;
          patternCell.effectcode =
            cellString[2] !== " "
              ? strToInt(cellString[2], 16)
              : NO_CHANGE_ON_PASTE;
          patternCell.effectparam =
            cellString[3] !== "  "
              ? strToInt(cellString[3], 16)
              : NO_CHANGE_ON_PASTE;
          return patternCell;
        });
      }
      throw new Error("Unsupported format");
    });

  return pattern;
};

// -- SUBPATTERNS --

const subPatternCelltoString = (
  p: SubPatternCell,
  fields: SubPatternCellKey[] = ["note", "jump", "effectcode", "effectparam"]
) => {
  return `|${fields.includes("note") ? renderNote(p.note) : "   "}${
    fields.includes("jump") ? renderInstrument(p.jump) : "  "
  }...${fields.includes("effectcode") ? renderEffect(p.effectcode) : " "}${
    fields.includes("effectparam") ? renderEffectParam(p.effectparam) : "  "
  }`;
};

export const parseSubPatternFieldsToClipboard = (
  subpattern: SubPatternCell[],
  selectedFields: number[]
) => {
  const parsed: string[] = [
    "GBStudio hUGETracker paste format compatible with...",
    "ModPlug Tracker  XM",
  ];

  const w = (selectedFields[selectedFields.length - 1] - selectedFields[0]) % 4;
  const h = Math.floor(
    (selectedFields[selectedFields.length - 1] - selectedFields[0]) / 4
  );
  const firstRow = Math.floor(selectedFields[0] / 4);
  const firstColumn = selectedFields[0] % 4;
  for (let i = firstRow; i <= firstRow + h; i++) {
    let rowStr = "";
    for (
      let j = Math.floor(firstColumn / 4);
      j <= Math.floor((firstColumn + w) / 4);
      j++
    ) {
      const start = firstColumn - j;
      const end = w + 1;
      rowStr += `${subPatternCelltoString(
        subpattern[i],
        subPatternCellFields.slice(Math.max(0, start), start + end)
      )}`;
    }
    parsed.push(rowStr);
  }
  return parsed.join("\n");
};

export const parseClipboardToSubPattern = (clipboard: string) => {
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
        const channel = r.substring(1).split("|");
        return channel.map((c, j) => {
          console.log(`CELL ${j}:`, c);
          const patternCell = new SubPatternCell();
          const cellString = [
            c.substring(0, 3),
            c.substring(3, 5),
            c.substring(8, 9),
            c.substring(9, 11),
          ];
          // Send NO_CHANGE_ON_PASTE to not change parameter when merging
          const note = noteStringsForClipboard.indexOf(cellString[0]);
          patternCell.note =
            cellString[0] !== "   "
              ? note === -1
                ? null
                : note
              : NO_CHANGE_ON_PASTE;
          patternCell.jump =
            cellString[1] !== "  "
              ? strToInt(cellString[1], 10, -1)
              : NO_CHANGE_ON_PASTE;
          patternCell.effectcode =
            cellString[2] !== " "
              ? strToInt(cellString[2], 16)
              : NO_CHANGE_ON_PASTE;
          patternCell.effectparam =
            cellString[3] !== "  "
              ? strToInt(cellString[3], 16)
              : NO_CHANGE_ON_PASTE;
          return patternCell;
        });
      }
      throw new Error("Unsupported format");
    });

  return pattern;
};
