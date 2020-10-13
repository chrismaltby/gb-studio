import React, { FC, useEffect, useState } from "react";
import { ipcRenderer, remote } from "electron";
import { ThemeProvider } from "styled-components";
import lightTheme from "./lightTheme";
import darkTheme from "./darkTheme";
import neonTheme from "./neonTheme";
import settings from "electron-settings";
import { ThemeInterface } from "./ThemeInterface";

const { nativeTheme } = remote;

const themeIds = ["dark", "light", "neon"] as const;
type ThemeId = typeof themeIds[number];

const themes: Record<ThemeId, ThemeInterface> = {
  light: lightTheme,
  dark: darkTheme,
  neon: neonTheme,
};

const toThemeId = (value: any, systemShouldUseDarkColors: boolean): ThemeId => {
  if (themeIds.indexOf(value) > -1) {
    return value;
  }
  if (systemShouldUseDarkColors) {
    return "dark";
  }
  return "light";
};

const Provider: FC = ({ children }) => {
  const [theme, setTheme] = useState<ThemeInterface>(lightTheme);
  useEffect(() => {
    const updateAppTheme = () => {
      const themeId = toThemeId(
        settings.get("theme"),
        nativeTheme.shouldUseDarkColors
      );
      setTheme(themes[themeId]);
    };

    nativeTheme.on("updated", () => {
      updateAppTheme();
    });

    ipcRenderer.on("update-theme", () => {
      updateAppTheme();
    });

    updateAppTheme();
  }, []);
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

export default Provider;
