import { fromSigned8Bit } from "shared/lib/helpers/8bit";
import { ensureNumber } from "shared/types";

const CONTROL_CODE_END = 16;

export type Token =
  | {
      type: "text";
      value: string;
      previewValue?: string;
    }
  | {
      type: "font";
      fontId: string;
    }
  | {
      type: "variable";
      variableId: string;
      fixedLength?: number;
    }
  | {
      type: "char";
      variableId: string;
    }
  | {
      type: "speed";
      speed: number;
    }
  | {
      type: "speedVariable";
      variableId: string;
    }
  | {
      type: "fontVariable";
      variableId: string;
    }
  | {
      type: "gotoxy";
      x: number;
      y: number;
      relative?: boolean;
    }
  | {
      type: "input";
      mask: number;
    }
  | {
      type: "wait";
      time: number;
      units: "frames" | "time";
      frames: number;
    };

export const lexText = (inputText: string): Token[] => {
  const tokens: Token[] = [];

  for (let i = 0; i < inputText.length; i++) {
    // Check for font change
    if (
      inputText[i] === "!" &&
      inputText[i + 1] === "F" &&
      inputText[i + 2] === ":"
    ) {
      const fontId = inputText.substring(i + 3, i + 40).replace(/!.*/, "");
      i += fontId.length + 3;
      tokens.push({
        type: "font",
        fontId,
      });
      continue;
    }

    // Check for printf variable %d
    if (
      inputText[i] === "%" &&
      inputText[i + 1] === "d" &&
      inputText[i + 2] === "$"
    ) {
      const variableMatch = inputText
        .substring(i + 2)
        .match(/^(\$L[0-9]\$|\$T[0-1]\$|\$V[0-9]\$|\$[0-9]+\$)/)?.[0];
      if (variableMatch) {
        i += variableMatch.length + 1;
        tokens.push({
          type: "variable",
          variableId: variableMatch.replace(/\$/g, ""),
        });
      } else {
        tokens.push({
          type: "text",
          value: inputText[i],
        });
      }
      continue;
    }

    // Check for printf variable %D
    if (
      inputText[i] === "%" &&
      inputText[i + 1] === "D" &&
      inputText[i + 3] === "$"
    ) {
      const variableMatch = inputText
        .substring(i + 3)
        .match(/^(\$L[0-9]\$|\$T[0-1]\$|\$V[0-9]\$|\$[0-9]+\$)/)?.[0];
      if (variableMatch) {
        tokens.push({
          type: "variable",
          variableId: variableMatch.replace(/\$/g, ""),
          fixedLength: parseInt(inputText[i + 2]) ?? 1,
        });
        i += variableMatch.length + 2;
      } else {
        tokens.push({
          type: "text",
          value: inputText[i],
        });
      }
      continue;
    }

    // Check for printf variable char code %c
    if (
      inputText[i] === "%" &&
      inputText[i + 1] === "c" &&
      inputText[i + 2] === "$"
    ) {
      const variableMatch = inputText
        .substring(i + 2)
        .match(/^(\$L[0-9]\$|\$T[0-1]\$|\$V[0-9]\$|\$[0-9]+\$)/)?.[0];
      if (variableMatch) {
        i += variableMatch.length + 1;
        tokens.push({
          type: "char",
          variableId: variableMatch.replace(/\$/g, ""),
        });
      } else {
        tokens.push({
          type: "text",
          value: inputText[i],
        });
      }
      continue;
    }

    // Check for printf variable speed %t
    if (
      inputText[i] === "%" &&
      inputText[i + 1] === "t" &&
      inputText[i + 2] === "$"
    ) {
      const variableMatch = inputText
        .substring(i + 2)
        .match(/^(\$L[0-9]\$|\$T[0-1]\$|\$V[0-9]\$|\$[0-9]+\$)/)?.[0];
      if (variableMatch) {
        i += variableMatch.length + 1;
        tokens.push({
          type: "speedVariable",
          variableId: variableMatch.replace(/\$/g, ""),
        });
      } else {
        tokens.push({
          type: "text",
          value: inputText[i],
        });
      }
      continue;
    }

    // Check for printf variable font %f
    if (
      inputText[i] === "%" &&
      inputText[i + 1] === "f" &&
      inputText[i + 2] === "$"
    ) {
      const variableMatch = inputText
        .substring(i + 2)
        .match(/^(\$L[0-9]\$|\$T[0-1]\$|\$V[0-9]\$|\$[0-9]+\$)/)?.[0];
      if (variableMatch) {
        i += variableMatch.length + 1;
        tokens.push({
          type: "fontVariable",
          variableId: variableMatch.replace(/\$/g, ""),
        });
      } else {
        tokens.push({
          type: "text",
          value: inputText[i],
        });
      }
      continue;
    }

    // Check for variable
    if (inputText[i] === "$") {
      const variableMatch = inputText
        .substring(i)
        .match(/^(\$L[0-9]\$|\$T[0-1]\$|\$V[0-9]\$|\$[0-9]+\$)/)?.[0];
      if (variableMatch) {
        i += variableMatch.length - 1;
        tokens.push({
          type: "variable",
          variableId: variableMatch.replace(/\$/g, ""),
        });
      } else {
        tokens.push({
          type: "text",
          value: inputText[i],
        });
      }
      continue;
    }
    // Check for character variable
    if (inputText[i] === "#") {
      const variableMatch = inputText
        .substring(i)
        .match(/^(#L[0-9]#|#T[0-1]#|#V[0-9]#|#[0-9]+#)/)?.[0];
      if (variableMatch) {
        i += variableMatch.length - 1;
        tokens.push({
          type: "char",
          variableId: variableMatch.replace(/#/g, ""),
        });
      } else {
        tokens.push({
          type: "text",
          value: inputText[i],
        });
      }
      continue;
    }
    // Check for speed codes
    if (
      inputText[i] === "!" &&
      inputText[i + 1] === "S" &&
      inputText[i + 2]?.match(/[0-5]/) &&
      inputText[i + 3] === "!"
    ) {
      const speed = Number(inputText[i + 2]);
      tokens.push({
        type: "speed",
        speed,
      });
      i += 3;
      continue;
    }

    // Check for escaped octal character
    if (
      inputText[i] === "\\" &&
      inputText[i + 1] === "0" &&
      inputText[i + 2] === "0" &&
      inputText[i + 3] === "5" &&
      inputText[i + 4] === "\\" &&
      inputText[i + 5]?.match(/[0-7]/) &&
      inputText[i + 6]?.match(/[0-7]/) &&
      inputText[i + 7]?.match(/[0-7]/)
    ) {
      tokens.push({
        type: "text",
        value: inputText.slice(i, i + 8),
        previewValue: String.fromCharCode(
          parseInt(inputText.substring(i + 5, i + 8), 8),
        ),
      });
      i += 7;
      continue;
    }

    // Check for escaped regular character
    if (
      inputText[i] === "\\" &&
      inputText[i + 1] === "0" &&
      inputText[i + 2] === "0" &&
      inputText[i + 3] === "5"
    ) {
      tokens.push({
        type: "text",
        value: inputText.slice(i, i + 5),
        previewValue: inputText.substring(i + 4, i + 5),
      });
      i += 4;
      continue;
    }

    // Check for gbvm gotoxy
    if (
      inputText[i] === "\\" &&
      inputText[i + 1] === "0" &&
      inputText[i + 2] === "0" &&
      inputText[i + 3] === "3" &&
      inputText[i + 4] === "\\" &&
      inputText[i + 5]?.match(/[0-7]/) &&
      inputText[i + 6]?.match(/[0-7]/) &&
      inputText[i + 7]?.match(/[0-7]/) &&
      inputText[i + 8] === "\\" &&
      inputText[i + 9]?.match(/[0-7]/) &&
      inputText[i + 10]?.match(/[0-7]/) &&
      inputText[i + 11]?.match(/[0-7]/)
    ) {
      tokens.push({
        type: "gotoxy",
        x: parseInt(inputText.substring(i + 5, i + 8), 8),
        y: parseInt(inputText.substring(i + 9, i + 12), 8),
      });
      i += 11;
      continue;
    }

    // Check for gbvm relative gotoxy
    if (
      inputText[i] === "\\" &&
      inputText[i + 1] === "0" &&
      inputText[i + 2] === "0" &&
      inputText[i + 3] === "4" &&
      inputText[i + 4] === "\\" &&
      inputText[i + 5]?.match(/[0-7]/) &&
      inputText[i + 6]?.match(/[0-7]/) &&
      inputText[i + 7]?.match(/[0-7]/) &&
      inputText[i + 8] === "\\" &&
      inputText[i + 9]?.match(/[0-7]/) &&
      inputText[i + 10]?.match(/[0-7]/) &&
      inputText[i + 11]?.match(/[0-7]/)
    ) {
      tokens.push({
        type: "gotoxy",
        x: fromSigned8Bit(parseInt(inputText.substring(i + 5, i + 8), 8)),
        y: fromSigned8Bit(parseInt(inputText.substring(i + 9, i + 12), 8)),
        relative: true,
      });
      i += 11;
      continue;
    }

    // Check for gbvm wait for input
    if (
      inputText[i] === "\\" &&
      inputText[i + 1] === "0" &&
      inputText[i + 2] === "0" &&
      inputText[i + 3] === "6" &&
      inputText[i + 4] === "\\" &&
      inputText[i + 5]?.match(/[0-7]/) &&
      inputText[i + 6]?.match(/[0-7]/) &&
      inputText[i + 7]?.match(/[0-7]/)
    ) {
      tokens.push({
        type: "input",
        mask: fromSigned8Bit(parseInt(inputText.substring(i + 5, i + 8), 8)),
      });
      i += 7;
      continue;
    }

    // Check for wait time
    if (
      inputText[i] === "!" &&
      inputText[i + 1] === "W" &&
      inputText[i + 2] === ":"
    ) {
      const timeString = inputText
        .substring(i + 3, i + 8)
        .replace(/[sf]![\s\S]*/, "");
      i += timeString.length + 4;
      const units = inputText[i - 1] === "s" ? "time" : "frames";
      const time = ensureNumber(parseInt(timeString, 10), 30);
      const frames = units === "time" ? time * 60 : time;
      tokens.push({
        type: "wait",
        time,
        units,
        frames,
      });
      continue;
    }

    // Check for newline
    if (
      inputText[i] === "\\" &&
      inputText[i + 1] === "0" &&
      inputText[i + 2] === "1" &&
      inputText[i + 3] === "2"
    ) {
      tokens.push({
        type: "text",
        value: "\\012",
      });
      i += 3;
      continue;
    }

    // Check for double % to make sure preview matches in game behaviour
    if (inputText[i] === "%" && inputText[i + 1] === "%") {
      tokens.push({
        type: "text",
        value: inputText.substring(i, i + 2),
        previewValue: inputText[i],
      });
      i += 1;
      continue;
    }

    // Ignore unmatched GBVM octal in previews
    if (inputText[i] === "\\" && inputText[i + 1]?.match(/[0-7]/)) {
      let len = 1;
      if (inputText[i + 2]?.match(/[0-7]/)) {
        len++;
        if (inputText[i + 3]?.match(/[0-7]/)) {
          len++;
        }
      }

      const octalCode = parseInt(inputText.substring(i + 1, i + len + 1), 8);

      tokens.push({
        type: "text",
        value: inputText.slice(i, i + len + 1),
        previewValue:
          octalCode > CONTROL_CODE_END ? String.fromCharCode(octalCode) : "",
      });
      i += len;
      continue;
    }

    // Add as text token
    const lastToken = tokens[tokens.length - 1];
    if (lastToken?.type === "text" && lastToken.previewValue === undefined) {
      lastToken.value += inputText[i];
    } else {
      tokens.push({
        type: "text",
        value: inputText[i],
      });
    }
  }
  return tokens;
};
