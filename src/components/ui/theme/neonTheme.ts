import { ThemeInterface } from "./ThemeInterface";

const darkheme: ThemeInterface = {
  typography: {
    fontSize: "13px",
  },
  colors: {
    highlight: "#f6019d",
    highlightText: "#ffffff",
    text: "#f5dcec",
    secondaryText: "#777777",
    toolbar: {
      background: "linear-gradient(to bottom, #630d86 0%, #271738 100%)",
      border: "#000000",
      inactiveBackground: "#3e4142",
      inactiveBorder: "#000000",
      textShadow: "0px 0px 5px rgba(206,89,55,0.81), 0px 0px 10px rgba(206,89,55,0.81)",
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
    },
    input: {
      background: "#000000",
      hoverBackground: "#111111",
      activeBackground: "#000000",
      text: "#f5dcec",
      border: "#540d6e",
    },
    sidebar: {
      background: "#241734",
      border: "#791e94",
    },
    document: {
      background: "#20142e"
    },
    list: {
      selectedBackground: "#000000",
      activeBackground: "#333333"
    }
  },
  borderRadius: 4,
};

export default darkheme;
