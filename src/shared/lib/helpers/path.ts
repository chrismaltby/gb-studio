import path from "path";

export const pathToPosix = (filepath: string): string =>
  filepath.split(path.sep).join(path.posix.sep);

export const naturalSortPaths = (filepaths: string[]): string[] => {
  return [...filepaths].sort((a, b) => {
    const splitA = a.split(/[\\/]/);
    const splitB = b.split(/[\\/]/);
    const len = Math.min(splitA.length, splitB.length);
    for (let i = 0; i < len; i++) {
      const aPart = splitA[i].replace(/\.[^.]*/, "");
      const bPart = splitB[i].replace(/\.[^.]*/, "");
      if (aPart !== bPart) {
        return aPart.localeCompare(bPart, undefined, {
          numeric: true,
          sensitivity: "base",
        });
      }
    }
    if (splitA.length > splitB.length) {
      return 1;
    }
    if (splitA.length < splitB.length) {
      return -1;
    }
    return 0;
  });
};
