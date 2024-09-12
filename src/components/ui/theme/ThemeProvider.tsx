import React, { ReactNode, useEffect, useState } from "react";
import { ThemeProvider } from "styled-components";
import lightTheme from "./lightTheme";
import darkTheme from "./darkTheme";
import lightThemeWin from "./lightThemeWin";
import darkThemeWin from "./darkThemeWin";
import neonTheme from "./neonTheme";
import { ThemeInterface } from "./ThemeInterface";
import API from "renderer/lib/api";
import type { ThemeId } from "shared/lib/theme";
import { defaultTheme } from "renderer/lib/theme";

const themes: Record<ThemeId, ThemeInterface> = {
  light: lightTheme,
  dark: darkTheme,
  neon: neonTheme,
};

const windowsThemes: Record<ThemeId, ThemeInterface> = {
  light: lightThemeWin,
  dark: darkThemeWin,
  neon: neonTheme,
};

const systemThemes = API.platform === "darwin" ? themes : windowsThemes;

const Provider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeInterface>(
    systemThemes[defaultTheme]
  );

  useEffect(() => {
    const updateAppTheme = (themeId: ThemeId) => {
      setTheme(systemThemes[themeId]);
    };
    API.theme.onChange(updateAppTheme);
  }, []);
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

export default Provider;
