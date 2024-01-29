import { ipcRenderer } from "electron";
import type { ThemeId } from "shared/lib/theme";

interface L10NLookup {
  [key: string]: string | boolean | undefined;
}

const APISetup = {
  platform: process.platform,
  test: () => console.log("Hello World"),
  l10n: {
    getL10NStrings: (): Promise<L10NLookup> =>
      ipcRenderer.invoke("get-l10n-strings"),
  },
  theme: {
    getTheme: (): Promise<ThemeId> => ipcRenderer.invoke("get-theme"),
    onChange: (callback: (themeId: ThemeId) => void) =>
      ipcRenderer.on("update-theme", (_, themeId: ThemeId) =>
        callback(themeId)
      ),
  },
};

export default APISetup;
