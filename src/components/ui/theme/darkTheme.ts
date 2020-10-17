import { ThemeInterface } from "./ThemeInterface";

const darkheme: ThemeInterface = {
  typography: {
    fontSize: "13px",
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
      character: "#ffd54f",
      speed: "#90caf9",     
      text: "#000000",  
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
      boxShadow: "0 0 0 1px rgba(150, 150, 150, 0.3), 0 4px 11px hsla(0, 0%, 0%, 0.1)",
    },
    input: {
      background: "#000000",
      hoverBackground: "#111111",
      activeBackground: "#000000",
      text: "#b7babb",
      border: "#333333",
    },
    sidebar: {
      background: "#222222",
      border: "#000000",
    },
    document: {
      background: "#444444"
    },
    list: {
      selectedBackground: "#000000",
      activeBackground: "#333333"
    }
  },
  borderRadius: 4,
};

export default darkheme;
