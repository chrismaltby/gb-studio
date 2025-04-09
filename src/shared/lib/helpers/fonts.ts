export const resolveMapping = (
  input: string,
  mapping?: Record<string, number | number[]>,
): { codes: number[]; length: number; isMapped: boolean } => {
  if (!mapping) {
    const code = input.codePointAt(0) ?? 0;
    const length = code > 0xffff ? 2 : 1;
    return { codes: [code], isMapped: false, length };
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
    return { codes, isMapped: true, length: longestMatch.length };
  }

  const code = input.codePointAt(0) ?? 0;
  const length = code > 0xffff ? 2 : 1;
  return { codes: [code], isMapped: false, length };
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
    const { codes, isMapped, length } = resolveMapping(slice, mapping);

    for (const code of codes) {
      if (code < 32 && isMapped) {
        // Escape mapped codes <32 with \005 escape code
        output += "\\005\\" + (code & 0xff).toString(8).padStart(3, "0");
      } else if (code < 32 || code > 127 || code === 34) {
        output += "\\" + (code & 0xff).toString(8).padStart(3, "0");
      } else {
        output += String.fromCharCode(code);
      }
    }

    i += length;
  }

  return output;
};
