import Path from "path";

export const pathToPosix = (filepath: string): string =>
  filepath.split(Path.sep).join(Path.posix.sep);

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

export const ensureNonEmptyBasename = (filename: string): string => {
  const posixFilename = pathToPosix(filename);
  if (posixFilename.endsWith("/")) {
    return pathToPosix(Path.join(posixFilename, "_"));
  }

  const dir = Path.dirname(posixFilename);
  const base = Path.basename(posixFilename);

  if (base.startsWith(".")) {
    return pathToPosix(Path.join(dir, `_${base}`));
  }

  return posixFilename;
};
