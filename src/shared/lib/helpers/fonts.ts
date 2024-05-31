export const encodeChar = (
  char: string,
  mapping?: Record<string, number>
): number => {
  let code = char.charCodeAt(0);
  const mappedCode = mapping?.[char.charAt(0)];
  if (mappedCode) {
    code = mappedCode;
  }
  return code;
};

export const encodeString = (
  inStr: string,
  mapping?: Record<string, number>
) => {
  let output = "";
  const nlStr = inStr
    .replace(/\\([0-9][0-9][0-9])/g, (a, b) =>
      String.fromCharCode(parseInt(b, 8))
    )
    .replace(/\\x([0-9A-Fa-f]+)/g, (a, b) =>
      String.fromCharCode(parseInt(b, 16))
    );
  for (let i = 0; i < nlStr.length; i++) {
    let code = nlStr.charCodeAt(i);
    const mappedCode = mapping?.[nlStr.charAt(i)];
    if (mappedCode) {
      code = mappedCode;
    }
    if (code < 32 || code > 127 || code === 34) {
      output += "\\" + (code & 0xff).toString(8).padStart(3, "0");
    } else {
      output += String.fromCharCode(code);
    }
  }
  return output;
};
