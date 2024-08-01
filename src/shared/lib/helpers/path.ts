import path from "path";

export const pathToPosix = (filepath: string): string =>
  filepath.split(path.sep).join(path.posix.sep);
