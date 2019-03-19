const trim2lines = string => {
  return string
    .replace(/^([^\n]*\n[^\n]*)[\w\W]*/g, "$1")
    .split("\n")
    .map((line, lineIndex) => {
      if (line.length <= 18) {
        return line;
      }
      if (lineIndex > 0) {
        return line.substring(0, 18);
      }
      const lastBreakSymbol = line.substring(0, 19).lastIndexOf(" ");
      if (lastBreakSymbol > -1) {
        return (
          line.substring(0, lastBreakSymbol) +
          "\n" +
          line.substring(lastBreakSymbol + 1, lastBreakSymbol + 19)
        );
      } else {
        return line.substring(0, 18);
      }
    })
    .join("\n")
    .split("\n")
    .slice(0, 2)
    .join("\n");
};

export default trim2lines;
