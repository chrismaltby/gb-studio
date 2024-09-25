import React, { ReactNode, useEffect, useState } from "react";
import { ThemeProvider } from "styled-components";
import { ThemeInterface } from "./ThemeInterface";
import API from "renderer/lib/api";
import { defaultTheme } from "renderer/lib/theme";

const Provider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeInterface>(defaultTheme);

  useEffect(() => {
    API.theme.onChange(setTheme);
  }, []);
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

export default Provider;
