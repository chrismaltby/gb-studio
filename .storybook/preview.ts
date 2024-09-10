import type { Preview } from "@storybook/react";

import { ThemeProvider } from "styled-components";
import { withThemeFromJSXProvider } from "@storybook/addon-themes";

/* TODO: update import for your custom theme configurations */
import lightTheme from "../src/components/ui/theme/lightTheme";
import darkTheme from "../src/components/ui/theme/darkTheme";

/* TODO: replace with your own global styles, or remove */
import { StorybookGlobalStyles } from "../src/components/ui/globalStyle";

// L10n
import en from "../src/lang/en.json";
import { setL10NData } from "../src/shared/lib/lang/l10n";
import type { WindowWithAPI } from "../src/renderer/lib/api";
import type RendererAPI from "../src/renderer/lib/api/setup";

(window as unknown as WindowWithAPI).API = {
  platform: "darwin",
} as typeof RendererAPI;
setL10NData(en);

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },

  decorators: [
    withThemeFromJSXProvider({
      themes: {
        light: lightTheme,
        dark: darkTheme,
      },
      defaultTheme: "light",
      Provider: ThemeProvider,
      GlobalStyles: StorybookGlobalStyles,
    }),
  ],
};

export default preview;
