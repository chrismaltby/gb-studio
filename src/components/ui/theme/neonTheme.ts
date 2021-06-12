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
