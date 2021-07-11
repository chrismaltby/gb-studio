import { ThemeInterface } from "./ThemeInterface";

const lightTheme: ThemeInterface = {
  type: "light",
  typography: {
    fontSize: "12px",
    menuFontSize: "12px",
    toolbarFontSize: "13px",
  },
  colors: {
    highlight: "#c92c61",
    highlightText: "#ffffff",
    translucent: "rgba(255,255,255,0.3)",
    hoverTranslucent: "rgba(255,255,255,0.4)",
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
      character: "#90caf9",
      operator: "#90caf9",
      code: "#aaaaaa",
      function: "#aaaaaa",
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
        boxShadow: "-1px 0px 2px 0px rgba(0, 0, 0, 0.2) inset",
        hoverBackground: "#cfcfcf",
      },
    },
    document: {
      background: "#f9f9f9",
    },
    list: {
      selectedBackground: "#dddddd",
      activeBackground: "#eaeaea",
    },
    scripting: {
      header: {
        text: "#3b3a3b",
        background: "#efefef",
        backgroundAlt: "#e4e4e4",
        nest1Background: "#b3e5fc",
        nest1BackgroundAlt: "#81d4fa",
        nest2Background: "#ffccbc",
        nest2BackgroundAlt: "#ffab91",
        nest3Background: "#c8e6c9",
        nest3BackgroundAlt: "#a5d6a7",
        nest4Background: "#d1c4e9",
        nest4BackgroundAlt: "#b39ddb",
        commentBackground: "#dcedc8",
        commentBackgroundAlt: "#c5e1a5",
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
  },
  borderRadius: 4,
};

export default lightTheme;
