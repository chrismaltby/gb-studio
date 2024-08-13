const stripInvalidFilenameCharacters = (string: string): string =>
  string
    .replace(/[:/\\?*|"><[\]#%&{}\b\0$!'@‘`“+^]/g, "")
    // Remove trailing period for Windows users
    .replace(/\.$/, "");

// Same as above but allows file path separators
export const stripInvalidPathCharacters = (string: string): string =>
  string
    .replace(/[:?*|"><[\]#%&{}\b\0$!'@‘`“+^.]/g, "")
    // Remove trailing period for Windows users
    .replace(/\.$/, "");

export default stripInvalidFilenameCharacters;
