export const encodeChar = (
  input: string,
  mapping?: Record<string, number>,
): { code: number; length: number } => {
  if (!mapping) {
    const code = input.codePointAt(0) ?? 0;
    const length = code > 0xffff ? 2 : 1; // surrogate pair = 2 units
    return { code, length };
  }

  // Find longest match in mapping
  // to allow multi character values in left side of mapping
  let longestMatch = "";
  for (const key of Object.keys(mapping)) {
    if (input.startsWith(key) && key.length > longestMatch.length) {
      longestMatch = key;
    }
  }

  if (longestMatch) {
    return {
      code: mapping[longestMatch] ?? 1,
      length: longestMatch.length,
    };
  }

  const code = input.codePointAt(0) ?? 0;
  const length = code > 0xffff ? 2 : 1;
  return { code, length };
};

export const encodeString = (
  inStr: string,
  mapping?: Record<string, number>,
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
    const { code, length } = encodeChar(slice, mapping);

    if (code < 32 || code > 127 || code === 34) {
      output += "\\" + (code & 0xff).toString(8).padStart(3, "0");
    } else {
      output += String.fromCharCode(code);
    }

    i += length;
  }

  return output;
};
