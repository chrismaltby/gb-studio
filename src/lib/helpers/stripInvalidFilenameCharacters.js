const stripInvalidFilenameCharacters = (string) =>
  string.replace(/[:/\\?*|"><[\]#%&{}\b\0$!'@‘`“+^]/g, "");

export default stripInvalidFilenameCharacters;
