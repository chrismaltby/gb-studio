import React from "react";
import { ThemeProvider } from "styled-components";
import darkTheme from "ui/theme/darkTheme";

export const darkThemeDecorator = (story: () => React.ReactNode) => (
  <ThemeProvider theme={darkTheme}>{story()}</ThemeProvider>
);
