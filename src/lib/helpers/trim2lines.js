const trim2lines = string => {
  return string
    .replace(/[^A-Za-z0-9 !"#$%&'()*+,-./;?\n]/g, "") // Strip unsupported characters
    .replace(/^([^\n]*\n[^\n]*)[\w\W]*/g, "$1")
    .split("\n")
    .map(line => line.substring(0, 18))
    .join("\n");
};

export default trim2lines;
