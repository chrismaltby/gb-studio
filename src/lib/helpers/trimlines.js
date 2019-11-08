const LINE_MAX = 3;
const LINE_MIN = 2;
const CHARS_PER_LINE = 18;
const CHARS_MAX_TOTAL = 18 + 18 + 16;

const trimlines = (string, maxCharsPerLine = CHARS_PER_LINE) => {
  let lengthCount = 0;
  return string
    .split("\n")
    .map((line, lineIndex) => {
      if (lineIndex === LINE_MAX - 1) {
        return line.substring(0, maxCharsPerLine);
      }
      if (line.length <= maxCharsPerLine) {
        return line;
      }
      const lastBreakSymbol = line
        .substring(0, maxCharsPerLine + 1)
        .lastIndexOf(" ");
      if (lastBreakSymbol > -1) {
        return `${line.substring(0, lastBreakSymbol)}\n${line.substring(
          lastBreakSymbol + 1,
          lastBreakSymbol + maxCharsPerLine + 1
        )}`;
      }
      return line.substring(0, maxCharsPerLine);
    })
    .join("\n")
    .split("\n")
    .map(line => {
      // Trim text over max limit
      lengthCount += line.length;
      if (lengthCount > CHARS_MAX_TOTAL) {
        const amountOver = lengthCount - CHARS_MAX_TOTAL;
        return line.substring(0, line.length - amountOver);
      }
      return line;
    })
    .slice(0, LINE_MAX)
    .join("\n");
};

export const textNumLines = string =>
  Math.max(LINE_MIN, (string || "").split("\n").length);

export default trimlines;
