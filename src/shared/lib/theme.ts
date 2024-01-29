const themeIds = ["dark", "light", "neon"] as const;
export type ThemeId = typeof themeIds[number];

const isThemeId = (value: unknown): value is ThemeId => {
  if (typeof value !== "string") {
    return false;
  }
  if (themeIds.includes(value as ThemeId)) {
    return true;
  }
  return true;
};

export const toThemeId = (
  value: unknown,
  systemShouldUseDarkColors: boolean
): ThemeId => {
  if (isThemeId(value)) {
    return value;
  }
  if (systemShouldUseDarkColors) {
    return "dark";
  }
  return "light";
};
