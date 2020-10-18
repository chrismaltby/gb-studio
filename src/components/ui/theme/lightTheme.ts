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
    conditional: {
      level1: "#b3e5fc",
      level2: "#ffccbc",
      level3: "#c8e6c9",
      level4: "#d1c4e9",
    },
    token: {
      variable: "#9ccc65",
      character: "#ffd54f",
      speed: "#90caf9",
      text: "#000000",
    },
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
      boxShadow: "0 0 0 1px rgba(150, 150, 150, 0.3), 0 4px 11px hsla(0, 0%, 0%, 0.1)",
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
