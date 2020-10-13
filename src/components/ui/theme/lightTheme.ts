import { ThemeInterface } from "./ThemeInterface";

const lightTheme: ThemeInterface = {
  typography: {
    fontSize: "13px",
  },
  colors: {
    highlight: "#c92c61",
    highlightText: "#ffffff",
    text: "#3b3a3b",
    secondaryText: "#999999",
    toolbar: {
      background: "linear-gradient(to bottom, #e8e7e8 0%, #d1d0d1 100%)",
      border: "#abaaab",
      inactiveBackground: "#f6f6f6",
      inactiveBorder: "#d1d1d1",
      textShadow: "none",
    },
    button: {
      background: "linear-gradient(to bottom, #fefdfe 0%, #f1f1f1 100%)",
      border: "#c5c5c5",
      borderTop: "#c5c5c5",
      activeBackground: "#eaeaea",
      text: "#3b3a3b",
      toolbar: {
        border: "#9f9e9e",
        borderTop: "#9f9e9e",
      },
      nestedBackground: "#cccccc",
      nestedActiveBackground: "#bbbbbb",
    },
    menu: {
      background: "#ffffff",
      hoverBackground: "#e8e7e8",
      activeBackground: "#e0e0e0",
      divider: "#d1d0d1",
    },
    input: {
      background: "#ffffff",
      hoverBackground: "#fafafa",
      activeBackground: "#ffffff",
      text: "#3b3a3b",
      border: "#d4d4d4",
    },
    sidebar: {
      background: "#f2f2f2",
      border: "#d4d4d4",
    },
    document: {
      background: "#f9f9f9"
    },
    list: {
      selectedBackground: "#dddddd",
      activeBackground: "#eaeaea"
    }
  },
  borderRadius: 4,
};

export default lightTheme;
