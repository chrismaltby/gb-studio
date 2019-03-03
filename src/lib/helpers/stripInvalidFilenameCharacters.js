const stripInvalidFilenameCharacters = string =>
  string.replace(/[:/\\?*|"><]/g, "");

export default stripInvalidFilenameCharacters;
