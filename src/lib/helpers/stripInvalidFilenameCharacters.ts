const stripInvalidFilenameCharacters = (string: string): string =>
  string
    .replace(/[:/\\?*|"><[\]#%&{}\b\0$!'@‘`“+^]/g, "")
    // Remove trailing period for Windows users
    .replace(/\.$/, "");

export default stripInvalidFilenameCharacters;
