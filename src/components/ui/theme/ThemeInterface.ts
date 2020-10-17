export interface ThemeInterface {
  typography: {
    fontSize: string;
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
      speed: string;
      text: string;
    }
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
    sidebar: {
      background: string;
      border: string;
    };
    document: {
      background: string;
    };
    list: {
      selectedBackground: string;
      activeBackground: string;
    };
  };
  borderRadius: number;
}

declare module "styled-components" {
  export interface DefaultTheme extends ThemeInterface {}
}
