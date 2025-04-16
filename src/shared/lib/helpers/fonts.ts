import { lexText, Token } from "shared/lib/compiler/lexText";

export interface FontData {
  id: string;
  img: HTMLImageElement;
  isMono: boolean;
  widths: number[];
  mapping: Record<string, number | number[]>;
}

export const resolveMapping = (
  input: string,
  mapping?: Record<string, number | number[]>,
): { codes: number[]; length: number } => {
  if (!mapping) {
    const code = input.codePointAt(0) ?? 0;
    const length = code > 0xffff ? 2 : 1;
    return { codes: [code], length };
  }

  let longestMatch = "";
  for (const key of Object.keys(mapping)) {
    if (input.startsWith(key) && key.length > longestMatch.length) {
      longestMatch = key;
    }
  }

  if (longestMatch) {
    const raw = mapping[longestMatch];
    const codes = Array.isArray(raw) ? raw : [raw];
    return { codes, length: longestMatch.length };
  }

  const code = input.codePointAt(0) ?? 0;
  const length = code > 0xffff ? 2 : 1;
  return { codes: [code], length };
};

export const encodeString = (
  inStr: string,
  mapping?: Record<string, number | number[]>,
): string => {
  let output = "";

  const decodedStr = inStr
    .replace(/\\([0-7]{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
    .replace(/\\x([0-9A-Fa-f]+)/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    );

  let i = 0;
  while (i < decodedStr.length) {
    const slice = decodedStr.slice(i);
    const { codes, length } = resolveMapping(slice, mapping);

    for (const code of codes) {
      if (code < 32 || code > 127 || code === 34) {
        output += "\\" + (code & 0xff).toString(8).padStart(3, "0");
      } else {
        output += String.fromCharCode(code);
      }
    }

    i += length;
  }

  return output;
};

export const lexTextWithMapping = (
  text: string,
  fontsData: Record<string, FontData>,
  fontId: string,
  preferPreviewValue?: boolean,
): Token[] => {
  const rawTokens = lexText(text);
  const result: Token[] = [];

  let font = fontsData[fontId];

  for (const token of rawTokens) {
    if (token.type === "font") {
      const newFont = fontsData[token.fontId];
      if (newFont) {
        font = newFont;
      }
      result.push(token);
      continue;
    }

    if (token.type === "text") {
      const value =
        preferPreviewValue && token.previewValue !== undefined
          ? token.previewValue
          : token.value;

      const encoded = encodeString(value, font?.mapping);
      const encodedTokens = lexText(encoded);
      result.push(...encodedTokens);
    } else {
      result.push(token);
    }
  }

  return result;
};
