import { ThemeInterface } from "./ThemeInterface";

const lightTheme: ThemeInterface = {
  name: "Light",
  type: "light",
  typography: {
    fontSize: "11px",
    menuFontSize: "12px",
    toolbarFontSize: "13px",
  },
  colors: {
    highlight: "#c92c61",
    highlightText: "#ffffff",
    text: "#3b3a3b",
    background: "#f9f9f9",
    secondaryText: "#999999",
    token: {
      variable: "#9ccc65",
      character: "#90caf9",
      operator: "#90caf9",
      code: "#aaaaaa",
      function: "#aaaaaa",
      constant: "#90caf9",
    },
    toolbar: {
      background: "linear-gradient(to bottom, #e8e7e8 0%, #d1d0d1 100%)",
      border: "#abaaab",
      inactiveBackground: "#f6f6f6",
      inactiveBorder: "#d1d1d1",
      textShadow: "none",
      button: {
        border: "#9f9e9e",
      },
    },
    button: {
      background: "linear-gradient(to bottom, #fefdfe 0%, #f1f1f1 100%)",
      border: "#c5c5c5",
      activeBackground: "#eaeaea",
      text: "#3b3a3b",
      nestedBackground: "#cccccc",
      nestedActiveBackground: "#bbbbbb",
    },
    menu: {
      background: "#ffffff",
      hoverBackground: "#e8e7e8",
      activeBackground: "#e0e0e0",
      divider: "#d1d0d1",
      boxShadow:
        "0 0 0 1px rgba(150, 150, 150, 0.3), 0 4px 11px hsla(0, 0%, 0%, 0.1)",
    },
    input: {
      background: "#ffffff",
      hoverBackground: "#fafafa",
      activeBackground: "#ffffff",
      text: "#3b3a3b",
      border: "#d4d4d4",
    },
    brackets: {
      color: "#d4d4d4",
      hoverBackground: "#f2f2f2",
    },
    card: {
      background: "#ffffff",
      text: "#3b3a3b",
      border: "#cccccc",
      divider: "#eeeeee",
      boxShadow: "3px 3px 10px rgba(0, 0, 0, 0.1)",
    },
    sidebar: {
      background: "#f2f2f2",
      border: "#d4d4d4",
      well: {
        background: "#dddddd",
        boxShadow: "-1px 0px 10px 0px rgba(0, 0, 0, 0.1) inset",
        hoverBackground: "#cfcfcf",
      },
      header: {
        background: "#ffffff",
        activeBackground: "#fafafa",
        border: "#d4d4d4",
        text: "#3b3a3b",
      },
    },
    panel: {
      background: "#f2f2f2",
      border: "#d4d4d4",
      divider: "#d4d4d4",
      text: "#3b3a3b",
      icon: "#3b3a3b",
      selectedIcon: "#000000",
      selectedBackground: "#cccccc",
      activeBackground: "#eaeaea",
      hoverBackground: "#dddddd",
    },
    document: {
      background: "#f9f9f9",
    },
    list: {
      text: "#3b3a3b",
      icon: "#888888",
      selectedBackground: "#dddddd",
      activeBackground: "#eaeaea",
    },
    tabs: {
      background: "linear-gradient(0deg, #f2f2f2 0%, #e4e4e4 100%)",
      selectedBackground: "#ffffff",
      secondaryBackground: "#ffffff",
      border: "#d4d4d4",
    },
    scripting: {
      tabs: {
        background: "#f2f2f2",
      },
      header: {
        text: "#3b3a3b",
        background: "linear-gradient(0deg, #e4e4e4, #efefef)",
        nest1Background: "linear-gradient(0deg, #81d4fa, #b3e5fc)",
        nest2Background: "linear-gradient(0deg, #ffab91, #ffccbc)",
        nest3Background: "linear-gradient(0deg, #a5d6a7, #c8e6c9)",
        nest4Background: "linear-gradient(0deg, #b39ddb, #d1c4e9)",
        commentBackground: "linear-gradient(0deg, #c5e1a5, #dcedc8)",
        disabledBackground:
          "linear-gradient(0deg,rgb(225, 165, 165),rgb(237, 200, 200))",
      },
      branch: {
        nest1Background: "#e1f5fe",
        nest2Background: "#fbe9e7",
        nest3Background: "#e8f5e9",
        nest4Background: "#f3e5f5",
      },
      form: {
        background: "#ffffff",
      },
      children: {
        nest1Border: "#b3e5fc",
        nest1Text: "#03a9f4",
        nest2Border: "#ffccbc",
        nest2Text: "#ff5722",
        nest3Border: "#c8e6c9",
        nest3Text: "#4CAF50",
        nest4Border: "#d1c4e9",
        nest4Text: "#9C27B0",
      },
      placeholder: {
        background: "#ccc",
      },
    },
    tracker: {
      background: "#f2f2f2",
      activeBackground: "#eaeaea",
      border: "#d4d4d4",
      text: "#3b3a3b",
      note: "#008894",
      instrument: "#738bd7",
      effectCode: "#f45d22",
      effectParam: "#ffad1f",
      rollCell: {
        border: "#3b3a3b66",
      },
    },
    prefab: {
      background: "#03a9f4",
      text: "#ffffff",
      button: {
        background: "#0288d1",
        hoverBackground: "#0277bd",
        text: "#ffffff",
      },
    },
  },
  borderRadius: 4,
};

export default lightTheme;
