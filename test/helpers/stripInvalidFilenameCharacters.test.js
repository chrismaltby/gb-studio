import stripInvalidFilenameCharacters from "../../src/lib/helpers/stripInvalidFilenameCharacters";

test("should allow valid filenames", () => {
  const filename = "ValidFilename";
  expect(stripInvalidFilenameCharacters(filename)).toBe(filename);
});

test("should remove square brackets from filename", () => {
  const filename = "Invalid[]Filename";
  expect(stripInvalidFilenameCharacters(filename)).toBe("InvalidFilename");
});

test("should strip all invalid characters from filename", () => {
  const filename = ":/\\?*|\"><[]#%&{}\b\0$!'@‘`“+^";
  expect(stripInvalidFilenameCharacters(filename)).toBe("");
});
