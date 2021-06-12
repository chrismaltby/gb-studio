export interface ThemeInterface {
  type: "light" | "dark";
  typography: {
    fontSize: string;
    menuFontSize: string;
    toolbarFontSize: string;
  };
  colors: {
    text: string;
    secondaryText: string;
    highlight: string;
    highlightText: string;
    conditional: {
      level1: string;
      level2: string;
      level3: string;
      level4: string;
    };
    token: {
      variable: string;
      character: string;
      code: string;
      function: string;
      operator: string;
    };
    toolbar: {
      background: string;
      inactiveBackground: string;
      border: string;
      inactiveBorder: string;
      textShadow: string;
    };
    button: {
      background: string;
      border: string;
      borderTop: string;
      activeBackground: string;
      text: string;
      toolbar: {
        border: string;
        borderTop: string;
      };
      nestedBackground: string;
      nestedActiveBackground: string;
    };
    menu: {
      background: string;
      hoverBackground: string;
      activeBackground: string;
      divider: string;
      boxShadow: string;
    };
    input: {
      background: string;
      hoverBackground: string;
      activeBackground: string;
      text: string;
      border: string;
    };
    card: {
      background: string;
      text: string;
      border: string;
      divider: string;
      boxShadow: string;
    };
    sidebar: {
      background: string;
      border: string;
      well: {
        background: string;
        boxShadow: string;
        hoverBackground: string;
      };
    };
    document: {
      background: string;
    };
    list: {
      selectedBackground: string;
      activeBackground: string;
    };
    tracker: {
      background: string;
      activeBackground: string;
      border: string;
      text: string;
      note: string;
      instrument: string;
      effectCode: string;
      effectParam: string;
      rollCell: {
        border: string;
      };
    };
  };
  borderRadius: number;
}

declare module "styled-components" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DefaultTheme extends ThemeInterface {}
}
