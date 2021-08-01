import React from "react";
import { ThemeProvider } from "styled-components";
import lightTheme from "ui/theme/lightTheme";
import GlobalStyle from "ui/globalStyle";

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

export const decorators = [
  (Story) => (
    <ThemeProvider theme={lightTheme}>
      <GlobalStyle />
      <Story />
    </ThemeProvider>
  ),
];
