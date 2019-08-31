const LINE_MAX = 3;
const LINE_MIN = 2;
const CHARS_PER_LINE = 18;

const trimlines = (string, maxCharsPerLine = CHARS_PER_LINE) => {
  return string
    .split("\n")
    .map((line, lineIndex) => {
      if (lineIndex === LINE_MAX - 1) {
        return line.substring(0, Math.min(maxCharsPerLine, CHARS_PER_LINE - 2));
      }
      if (line.length <= maxCharsPerLine) {
        return line;
      }
      const lastBreakSymbol = line
        .substring(0, maxCharsPerLine + 1)
        .lastIndexOf(" ");
      if (lastBreakSymbol > -1) {
        return (
          `${line.substring(0, lastBreakSymbol) 
          }\n${ 
          line.substring(
            lastBreakSymbol + 1,
            lastBreakSymbol + maxCharsPerLine + 1
          )}`
        );
      } 
        return line.substring(0, maxCharsPerLine);
      
    })
    .join("\n")
    .split("\n")
    .slice(0, LINE_MAX)
    .join("\n");
};

export const textNumLines = string =>
  Math.min(LINE_MAX, Math.max(LINE_MIN, (string || "").split("\n").length));

export default trimlines;
