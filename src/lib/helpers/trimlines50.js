const LINE_MAX = 3;
const LINE_MIN = 2;
const CHARS_PER_LINE = 50;

const trimlines = string => {
  return string
    .split("\n")
    .map((line, lineIndex, lines) => {
      if (lineIndex === LINE_MAX - 1) {
        return line.substring(0, CHARS_PER_LINE - 2);
      }
      if (line.length <= CHARS_PER_LINE) {
        return line;
      }
      const lastBreakSymbol = line
        .substring(0, CHARS_PER_LINE + 1)
        .lastIndexOf(" ");
      if (lastBreakSymbol > -1) {
        return (
          `${line.substring(0, lastBreakSymbol) 
          }\n${ 
          line.substring(
            lastBreakSymbol + 1,
            lastBreakSymbol + CHARS_PER_LINE + 1
          )}`
        );
      } 
        return line.substring(0, CHARS_PER_LINE);
      
    })
    .join("\n")
    .split("\n")
    .slice(0, LINE_MAX)
    .join("\n");
};

export const textNumLines = string =>
  Math.min(LINE_MAX, Math.max(LINE_MIN, (string || "").split("\n").length));

export default trimlines;
