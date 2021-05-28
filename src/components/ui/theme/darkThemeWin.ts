import { ThemeInterface } from "./ThemeInterface";
import darkTheme from "./darkTheme";

const darkThemeWin: ThemeInterface = {
  ...darkTheme,
  colors: {
    ...darkTheme.colors,
    text: "#e8eaed",
    toolbar: {
      ...darkTheme.colors.toolbar,
      background: "#292a2d",
      inactiveBackground: "#292a2d",
      border: "#000000",
    },
    button: {
      ...darkTheme.colors.button,
      toolbar: {
        ...darkTheme.colors.button.toolbar,
        border: "#333333",
        borderTop: "#333333",
      },
      background: "#6a6d6e",
      border: "#333333",
      borderTop: "#333333",
    },
    menu: {
      ...darkTheme.colors.menu,
      background: "#292a2d",
      hoverBackground: "#4b4c4f",
      boxShadow: "2px 2px 2px rgba(0,0,0,0.3), 0px 0px 1px rgba(128,128,128,1)",
    },
  },
  borderRadius: 1,
};

export default darkThemeWin;
