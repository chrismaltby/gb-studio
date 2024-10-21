import { ThemeInterface } from "./ThemeInterface";
import lightTheme from "./lightTheme";

const lightThemeWin: ThemeInterface = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    toolbar: {
      ...lightTheme.colors.toolbar,
      background: "#ffffff",
      inactiveBackground: "#ffffff",
      border: "#dddddd",
      button: {
        ...lightTheme.colors.toolbar.button,
        border: "#bbbbbb",
      },
    },
    button: {
      ...lightTheme.colors.button,
      background: "#fafafa",
      border: "#bbbbbb",
    },
    menu: {
      ...lightTheme.colors.menu,
      boxShadow: "2px 2px 2px rgba(0,0,0,0.3), 0px 0px 1px rgba(128,128,128,1)",
    },
  },
  borderRadius: 1,
};

export default lightThemeWin;
