import stripInvalidFilenameCharacters from "./stripInvalidFilenameCharacters";

export const getROMFileStem = (
  overrideName: string,
  projectName: string,
): string => {
  const source =
    stripInvalidFilenameCharacters(overrideName).trim().length > 0
      ? overrideName
      : kebabCase(projectName.trim());

  const stem = stripInvalidFilenameCharacters(source)
    .replace(/(\.gb|\.gbc|\.pocket)$/i, "")
    .trim();

  if (stem.replace(/-/g, "").length === 0) {
    return "game";
  }

  return stem;
};

export const getROMFilename = (
  overrideName: string,
  projectName: string,
  isColorOnly: boolean,
  buildType: "rom" | "pocket" | "web",
): string => {
  let fileExt = "gb";
  if (buildType === "pocket") {
    fileExt = "pocket";
  } else if (isColorOnly && !overrideName.endsWith(".gb")) {
    fileExt = "gbc";
  }
  const fileStem = getROMFileStem(overrideName, projectName);
  return `${fileStem}.${fileExt}`;
};

export const kebabCase = (string: string): string =>
  string.toLocaleLowerCase().replace(/[ ]+/g, "-");
