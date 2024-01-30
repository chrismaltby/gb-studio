import { ipcRenderer } from "electron";
import type { ThemeId } from "shared/lib/theme";
import type { JsonValue } from "shared/types";

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
  settings: {
    get: (key: string) => ipcRenderer.invoke("settings-get", key),
    set: (key: string, value: JsonValue) =>
      ipcRenderer.invoke("settings-set", key, value),
    delete: (key: string) => ipcRenderer.invoke("settings-delete", key),
  },
};

export default APISetup;
