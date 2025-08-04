export interface ThemeInterface {
  name: string;
  type: "light" | "dark";
  typography: {
    fontSize: string;
    menuFontSize: string;
    toolbarFontSize: string;
  };
  colors: {
    text: string;
    background: string;
    secondaryText: string;
    highlight: string;
    highlightText: string;
    token: {
      variable: string;
      character: string;
      code: string;
      function: string;
      operator: string;
      constant: string;
    };
    toolbar: {
      background: string;
      inactiveBackground: string;
      border: string;
      inactiveBorder: string;
      textShadow: string;
      button: {
        border: string;
      };
    };
    button: {
      background: string;
      border: string;
      activeBackground: string;
      text: string;
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
    brackets: {
      color: string;
      hoverBackground: string;
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
      header: {
        background: string;
        activeBackground: string;
        border: string;
        text: string;
      };
    };
    panel: {
      background: string;
      border: string;
      divider: string;
      text: string;
      icon: string;
      selectedIcon: string;
      selectedBackground: string;
      hoverBackground: string;
      activeBackground: string;
    };
    document: {
      background: string;
    };
    list: {
      text: string;
      icon: string;
      selectedBackground: string;
      activeBackground: string;
    };
    tabs: {
      background: string;
      selectedBackground: string;
      secondaryBackground: string;
      border: string;
    };
    scripting: {
      header: {
        text: string;
        background: string;
        nest1Background: string;
        nest2Background: string;
        nest3Background: string;
        nest4Background: string;
        commentBackground: string;
        disabledBackground: string;
      };
      branch: {
        nest1Background: string;
        nest2Background: string;
        nest3Background: string;
        nest4Background: string;
      };
      tabs: {
        background: string;
      };
      form: {
        background: string;
      };
      children: {
        nest1Border: string;
        nest1Text: string;
        nest2Border: string;
        nest2Text: string;
        nest3Border: string;
        nest3Text: string;
        nest4Border: string;
        nest4Text: string;
      };
      placeholder: {
        background: string;
      };
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
    prefab: {
      background: string;
      text: string;
      button: {
        background: string;
        hoverBackground: string;
        text: string;
      };
    };
  };
  borderRadius: number;
}

declare module "styled-components" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DefaultTheme extends ThemeInterface {}
}
