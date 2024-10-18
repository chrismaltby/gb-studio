import { getGlobalPluginsPath } from "lib/pluginManager/globalPlugins";
import darkTheme from "ui/theme/darkTheme";
import darkThemeWin from "ui/theme/darkThemeWin";
import lightTheme from "ui/theme/lightTheme";
import lightThemeWin from "ui/theme/lightThemeWin";
import { ThemeInterface } from "ui/theme/ThemeInterface";
import glob from "glob";
import { promisify } from "util";
import { join, relative } from "path";
import { readJSON } from "fs-extra";
import { merge, cloneDeep } from "lodash";

const globAsync = promisify(glob);

const themeIds = ["dark", "light"] as const;
export type ThemeId = typeof themeIds[number];

const themes: Record<ThemeId, ThemeInterface> = {
  light: lightTheme,
  dark: darkTheme,
};

const windowsThemes: Record<ThemeId, ThemeInterface> = {
  light: lightThemeWin,
  dark: darkThemeWin,
};

export interface ThemePlugin {
  id: string;
  name: string;
  theme: JSON;
}

export const loadThemePlugin = async (
  path: string
): Promise<(JSON & { name: string; type: unknown }) | null> => {
  try {
    const theme = await readJSON(path);
    if (!theme.name) {
      throw new Error("Theme is missing name");
    }
    return theme;
  } catch (e) {
    console.error("Unable to load theme", e);
  }
  return null;
};

export class ThemeManager {
  systemThemes: Record<ThemeId, ThemeInterface>;
  pluginThemes: Record<string, ThemeInterface>;

  constructor(platform: string) {
    this.systemThemes = platform === "darwin" ? themes : windowsThemes;
    this.pluginThemes = {};
  }

  async loadPluginThemes() {
    this.pluginThemes = {};
    const globalPluginsPath = getGlobalPluginsPath();
    const pluginPaths = await globAsync(
      join(globalPluginsPath, "**/theme.json")
    );
    for (const path of pluginPaths) {
      const theme = await loadThemePlugin(path);
      if (theme) {
        const id = relative(globalPluginsPath, path);
        const baseTheme =
          theme.type === "dark"
            ? this.systemThemes.dark
            : this.systemThemes.light;
        const mergedTheme = merge(cloneDeep(baseTheme), theme);
        this.pluginThemes[id] = mergedTheme;
      }
    }
  }

  async loadPluginTheme(path: string) {
    const globalPluginsPath = getGlobalPluginsPath();
    const theme = await loadThemePlugin(path);
    if (theme) {
      const id = relative(globalPluginsPath, path);
      const baseTheme =
        theme.type === "dark"
          ? this.systemThemes.dark
          : this.systemThemes.light;
      const mergedTheme = merge(cloneDeep(baseTheme), theme);
      this.pluginThemes[id] = mergedTheme;
      return mergedTheme;
    }
  }

  getTheme(themeId: string, systemShouldUseDarkColors: boolean) {
    // Use plugin theme if available
    const pluginTheme = this.pluginThemes[themeId];
    if (pluginTheme) {
      return pluginTheme;
    }

    // If light/dark set manually
    if (themeId === "light") {
      return this.systemThemes[themeId];
    } else if (themeId === "dark") {
      return this.systemThemes[themeId];
    }

    // Fallback to system theme
    if (systemShouldUseDarkColors) {
      return this.systemThemes["dark"];
    }
    return this.systemThemes["light"];
  }

  getPluginThemes() {
    return Object.entries(this.pluginThemes).map(([id, theme]) => {
      return {
        id,
        name: theme.name,
      };
    });
  }
}
