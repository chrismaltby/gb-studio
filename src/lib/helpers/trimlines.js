const LINE_MAX = 3;
const LINE_MIN = 2;
const CHARS_PER_LINE = 18;
const CHARS_MAX_TOTAL = 18 + 18 + 16;

const varRegex = new RegExp("\\$[VLT][0-9]+\\$", "g");
const varCharRegex = new RegExp("#[VLT][0-9]+#", "g");
const commandRegex = new RegExp("\\!S[0-5]\\!", "g");

const startsWithVarRegex = new RegExp("^\\$[VLT][0-9]+\\$");
const startsWithVarCharRegex = new RegExp("^#[VLT][0-9]+#");
const startsWithCommandRegex = new RegExp("^\\!S[0-5]\\!");

export const lineLength = (line) => {
  return line
    .replace(varRegex, "255")
    .replace(varCharRegex, "C")
    .replace(commandRegex, "")
    .length
}

const trimlines = (string, maxCharsPerLine = CHARS_PER_LINE) => {
  let lengthCount = 0;

  return string
    .split("\n")
    .map((line, lineIndex) => {

      let cropLength = 0;
      let textLength = 0;

      // Determine crop length by checking for escape codes
      for (let i=0; i<line.length; i++) {
        const remaining = line.substring(i);

        if (remaining.match(startsWithCommandRegex)) {
          i += 3;
          cropLength += 4;
        } else if (remaining.match(startsWithVarRegex)) {
          if (textLength + 3 < maxCharsPerLine) {
            textLength += 3;
            cropLength += remaining.match(startsWithVarRegex)[0].length;            
          }
        } else if (remaining.match(startsWithVarCharRegex)) {
          if (textLength + 1 < maxCharsPerLine) {
            textLength += 1;
            cropLength += remaining.match(startsWithVarCharRegex)[0].length;            
          }
        } else if (textLength < maxCharsPerLine) {
          textLength++;
          cropLength++;
        } else {
          break;
        }
      }

      if (lineIndex === LINE_MAX - 1) {
        return line.substring(0, cropLength);
      }

      if (lineLength(line) <= maxCharsPerLine) {
        return line;
      }
      const lastBreakSymbol = line
        .substring(0, cropLength + 1)
        .lastIndexOf(" ");
      if (lastBreakSymbol > -1) {
        return `${line.substring(0, lastBreakSymbol)}\n${line.substring(
          lastBreakSymbol + 1,
          lastBreakSymbol + cropLength + 1
        )}`;
      }

      return line.substring(0, cropLength);
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
