import { ThemeInterface } from "./ThemeInterface";

const darkTheme: ThemeInterface = {
  type: "dark",
  typography: {
    fontSize: "11px",
    menuFontSize: "12px",
    toolbarFontSize: "13px",
  },
  colors: {
    highlight: "#c92c61",
    highlightText: "#ffffff",
    text: "#b7babb",
    background: "#222222",
    secondaryText: "#777777",
    token: {
      variable: "#9ccc65",
      character: "#90caf9",
      operator: "#90caf9",
      code: "#ffffff",
      function: "#ffffff",
      constant: "#90caf9",
    },
    toolbar: {
      background: "linear-gradient(to bottom, #3e4142 0%, #282a2a 100%)",
      border: "#000000",
      inactiveBackground: "#3e4142",
      inactiveBorder: "#000000",
      textShadow: "none",
      button: {
        border: "transparent",
        borderTop: "#9f9e9e",
      },
    },
    button: {
      background: "linear-gradient(to bottom, #6a6d6e 0%, #616364 100%)",
      border: "transparent",
      borderTop: "#9f9e9e",
      activeBackground: "#505252",
      text: "#fbfeff",
      nestedBackground: "#444444",
      nestedActiveBackground: "#555555",
    },
    menu: {
      background: "#000000",
      hoverBackground: "#282a2a",
      activeBackground: "#333333",
      divider: "#282a2a",
      boxShadow:
        "0 0 0 1px rgba(150, 150, 150, 0.3), 0 4px 11px hsla(0, 0%, 0%, 0.1)",
    },
    input: {
      background: "#000000",
      hoverBackground: "#111111",
      activeBackground: "#000000",
      text: "#b7babb",
      border: "#333333",
    },
    brackets: {
      color: "#000000",
      hoverBackground: "#222222",
    },
    card: {
      background: "#3e4142",
      text: "#b7babb",
      border: "#111111",
      divider: "#333333",
      boxShadow: "3px 3px 10px rgba(0, 0, 0, 1)",
    },
    sidebar: {
      background: "#222222",
      border: "#000000",
      well: {
        background: "#333333",
        boxShadow: "-1px 0px 10px 1px rgba(0, 0, 0, 0.5) inset",
        hoverBackground: "#505252",
      },
      header: {
        background: "#000000",
        activeBackground: "#111111",
        border: "#333333",
        text: "#b7babb",
      },
    },
    document: {
      background: "#444444",
    },
    list: {
      selectedBackground: "#000000",
      activeBackground: "#333333",
    },
    tabs: {
      background: "#000000",
      border: "#333333",
    },
    scripting: {
      header: {
        text: "#ffffff",
        background: "#4e4e4e",
        backgroundAlt: "#444444",
        nest1Background: "#546e7a",
        nest1BackgroundAlt: "#37474f",
        nest2Background: "#0b3565",
        nest2BackgroundAlt: "#051e42",
        nest3Background: "#215924",
        nest3BackgroundAlt: "#103713",
        nest4Background: "#4a136c",
        nest4BackgroundAlt: "#320d5e",
        commentBackground: "#8bc34a",
        commentBackgroundAlt: "#7cb342",
      },
      branch: {
        nest1Background: "#37474f",
        nest2Background: "#203D6A",
        nest3Background: "#27492A",
        nest4Background: "#3F2460",
      },
      form: {
        background: "#333333",
      },
      children: {
        nest1Border: "#607d8b",
        nest1Text: "#607d8b",
        nest2Border: "#2196f3",
        nest2Text: "#2196f3",
        nest3Border: "#4caf50",
        nest3Text: "#4caf50",
        nest4Border: "#9575cd",
        nest4Text: "#9575cd",
      },
      placeholder: {
        background: "#000",
      },
    },
    tracker: {
      background: "#222222",
      activeBackground: "#333333",
      border: "#000000",
      text: "#b7babb",
      note: "#008894",
      instrument: "#738bd7",
      effectCode: "#f45d22",
      effectParam: "#ffad1f",
      rollCell: {
        border: "#b7babb44",
      },
    },
    prefab: {
      background: "#01579b",
      text: "#ffffff",
      button: {
        background: "#0288d1",
        hoverBackground: "#039be5",
        text: "#ffffff",
      },
    },
  },
  borderRadius: 4,
};

export default darkTheme;
