import React, { FC, useEffect, useState } from "react";
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
// eslint-disable-next-line import/no-webpack-loader-syntax
import darkThemeCSS from "!!raw-loader!../../../styles/theme-dark.css";
// eslint-disable-next-line import/no-webpack-loader-syntax
import lightThemeCSS from "!!raw-loader!../../../styles/theme.css";

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

const Provider: FC = ({ children }) => {
  const [theme, setTheme] = useState<ThemeInterface>(
    systemThemes[defaultTheme]
  );

  useEffect(() => {
    const updateAppTheme = (themeId: ThemeId) => {
      setTheme(systemThemes[themeId]);
      handleOldCSSThemes(themeId);
    };

    // @TODO Eventually move all this styling into ThemeProvider theme
    const handleOldCSSThemes = (themeId: ThemeId) => {
      const darkMode = themeId === "dark";
      const themeStyle = document.getElementById("theme");
      if (themeStyle) {
        themeStyle.innerHTML = darkMode ? darkThemeCSS : lightThemeCSS;
      }
    };

    API.theme.onChange(updateAppTheme);
    handleOldCSSThemes(defaultTheme);
  }, []);
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

export default Provider;
