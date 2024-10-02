import { ThemeInterface } from "./ThemeInterface";

const darkTheme: ThemeInterface = {
  name: "Dark",
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
    background: "#444444",
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
        border: "#313334",
      },
    },
    button: {
      background:
        "linear-gradient(to bottom, #9f9e9e 0%, #9f9e9e 5%, #6a6d6e 5%, #616364 100%) no-repeat",
      border: "#313334",
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
    panel: {
      background: "#222222",
      border: "#000000",
      divider: "#000000",
      text: "#b7babb",
      icon: "#b7babb",
      selectedIcon: "#ffffff",
      selectedBackground: "#111111",
      activeBackground: "#444444",
      hoverBackground: "#333333",
    },
    document: {
      background: "#444444",
    },
    list: {
      text: "#b7babb",
      icon: "#666666",
      selectedBackground: "#000000",
      activeBackground: "#333333",
    },
    tabs: {
      background: "linear-gradient(0deg, #222 0%, #111 100%)",
      selectedBackground: "#000000",
      secondaryBackground: "#000000",
      border: "#333333",
    },
    scripting: {
      tabs: {
        background: "#222222",
      },
      header: {
        text: "#ffffff",
        background: "linear-gradient(0deg, #444444, #4e4e4e)",
        nest1Background: "linear-gradient(0deg, #37474f, #546e7a)",
        nest2Background: "linear-gradient(0deg, #051e42, #0b3565)",
        nest3Background: "linear-gradient(0deg, #103713, #215924)",
        nest4Background: "linear-gradient(0deg, #320d5e, #4a136c)",
        commentBackground: "linear-gradient(0deg, #7cb342, #8bc34a)",
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
