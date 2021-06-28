import { ThemeInterface } from "./ThemeInterface";

const darkTheme: ThemeInterface = {
  type: "dark",
  typography: {
    fontSize: "12px",
    menuFontSize: "12px",
    toolbarFontSize: "13px",
  },
  colors: {
    highlight: "#c92c61",
    highlightText: "#ffffff",
    text: "#b7babb",
    secondaryText: "#777777",
    conditional: {
      level1: "#01579b",
      level2: "#bf360c",
      level3: "#1b5e20",
      level4: "#311b92",
    },
    token: {
      variable: "#9ccc65",
      character: "#90caf9",
      operator: "#90caf9",
      code: "#ffffff",
      function: "#ffffff",
    },
    toolbar: {
      background: "linear-gradient(to bottom, #3e4142 0%, #282a2a 100%)",
      border: "#000000",
      inactiveBackground: "#3e4142",
      inactiveBorder: "#000000",
      textShadow: "none",
    },
    button: {
      background: "linear-gradient(to bottom, #6a6d6e 0%, #616364 100%)",
      border: "transparent",
      borderTop: "#9f9e9e",
      activeBackground: "#505252",
      text: "#fbfeff",
      toolbar: {
        border: "transparent",
        borderTop: "#9f9e9e",
      },
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
        boxShadow: "-1px 0px 2px 1px rgba(0, 0, 0, 0.5) inset",
        hoverBackground: "#505252",
      },
    },
    document: {
      background: "#444444",
    },
    list: {
      selectedBackground: "#000000",
      activeBackground: "#333333",
    },
    scripting: {
      header: {
        text: "#ffffff",
        background: "#444444",
        backgroundAlt: "#383838",
        nest1Background: "#455a64",
        nest1BackgroundAlt: "#37474f",
        nest2Background: "#006064",
        nest2BackgroundAlt: "#00838f",
        nest3Background: "#00695c",
        nest3BackgroundAlt: "#004d40",
        nest4Background: "#2b698e",
        nest4BackgroundAlt: "#1c506f",
        commentBackground: "#8bc34a",
        commentBackgroundAlt: "#7cb342",
      },
      form: {
        background: "#222222",
      },
      children: {
        boxShadow: "-2px 2px 5px hsla(0,0%,0%,0.5)",
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
  },
  borderRadius: 4,
};

export default darkTheme;
