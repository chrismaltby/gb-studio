import { ThemeInterface } from "./ThemeInterface";

const neonTheme: ThemeInterface = {
  type: "dark",
  typography: {
    fontSize: "11px",
    menuFontSize: "12px",
    toolbarFontSize: "13px",
  },
  colors: {
    highlight: "#f6019d",
    highlightText: "#ffffff",
    translucent: "rgba(0,0,0,0.1)",
    hoverTranslucent: "rgba(0,0,0,0.3)",
    text: "#f5dcec",
    secondaryText: "#777777",
    conditional: {
      level1: "#01579b",
      level2: "#bf360c",
      level3: "#1b5e20",
      level4: "#311b92",
    },
    token: {
      variable: "#9ccc65",
      character: "#ffd54f",
      operator: "#90caf9",
      code: "#90caf9",
      function: "#ffd54f",
    },
    toolbar: {
      background: "linear-gradient(to bottom, #630d86 0%, #271738 100%)",
      border: "#000000",
      inactiveBackground: "#3e4142",
      inactiveBorder: "#000000",
      textShadow:
        "0px 0px 5px rgba(206,89,55,0.81), 0px 0px 10px rgba(206,89,55,0.81)",
    },
    button: {
      background: "linear-gradient(to bottom, #521386 0%, #2f2058 100%)",
      border: "#0e0322",
      borderTop: "#923b76",
      activeBackground: "#f6019d",
      text: "#f5dcec",
      toolbar: {
        border: "#2f2058",
        borderTop: "#923b76",
      },
      nestedBackground: "#20142e",
      nestedActiveBackground: "#f6019d",
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
      text: "#f5dcec",
      border: "#540d6e",
    },
    card: {
      background: "#ffffff",
      text: "#3b3a3b",
      border: "#cccccc",
      divider: "#eeeeee",
      boxShadow: "3px 3px 10px rgba(0, 0, 0, 0.1)",
    },
    sidebar: {
      background: "#241734",
      border: "#791e94",
      well: {
        background: "#111111",
        boxShadow: "-1px 0px 2px 0px rgba(0, 0, 0, 1) inset",
        hoverBackground: "#000000",
      },
    },
    document: {
      background: "#20142e",
    },
    list: {
      selectedBackground: "#000000",
      activeBackground: "#333333",
    },
    scripting: {
      header: {
        text: "#ffffff",
        background: "#0a0e0e",
        backgroundAlt: "#101515",
        nest1Background: "#01579b",
        nest1BackgroundAlt: "#0277bd",
        nest2Background: "#bf360c",
        nest2BackgroundAlt: "#d84315",
        nest3Background: "#1b5e20",
        nest3BackgroundAlt: "#2e7d32",
        nest4Background: "#311b92",
        nest4BackgroundAlt: "#4527a0",
        commentBackground: "#8bc34a",
        commentBackgroundAlt: "#7cb342",
      },
      branch: {
        nest1Background: "#1565c0",
        nest2Background: "#ca750b",
        nest3Background: "#2e7d32",
        nest4Background: "#6a1b9a",
      },
      form: {
        background: "#000000",
      },
      children: {
        nest1Border: "#1565c0",
        nest1Text: "#1565c0",
        nest2Border: "#ca750b",
        nest2Text: "#ca750b",
        nest3Border: "#2e7d32",
        nest3Text: "#2e7d32",
        nest4Border: "#6a1b9a",
        nest4Text: "#6a1b9a",
      },
      placeholder: {
        background: "#666",
      },
    },
    tracker: {
      background: "#222222",
      activeBackground: "#333333",
      border: "#000000",
      text: "#b7babb",
      note: "#008894",
      instrument: "#fcb800",
      effectCode: "#e76f51",
      effectParam: "#f4a261",
      rollCell: {
        border: "#b7babb44",
      },
    },
  },
  borderRadius: 4,
};

export default neonTheme;
