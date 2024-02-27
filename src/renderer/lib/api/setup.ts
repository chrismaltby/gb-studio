import { ipcRenderer } from "electron";
import type { CreateProjectInput } from "lib/project/createProject";
import type { ThemeId } from "shared/lib/theme";
import {
  ensurePromisedNumber,
  ensurePromisedString,
  JsonValue,
} from "shared/types";

interface L10NLookup {
  [key: string]: string | boolean | undefined;
}

const APISetup = {
  platform: process.platform,
  test: () => console.log("Hello World"),
  app: {
    openExternal: (path: string) => ipcRenderer.invoke("open-external", path),
  },
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
  paths: {
    getDocumentsPath: (): Promise<string> =>
      ipcRenderer.invoke("get-documents-path"),
    getTmpPath: (): Promise<string> => ipcRenderer.invoke("get-tmp-path"),
  },
  settings: {
    get: (key: string): Promise<unknown> =>
      ipcRenderer.invoke("settings-get", key),
    getString: (key: string, fallback: string): Promise<string> =>
      ensurePromisedString(ipcRenderer.invoke("settings-get", key), fallback),
    getNumber: (key: string, fallback: number): Promise<number> =>
      ensurePromisedNumber(ipcRenderer.invoke("settings-get", key), fallback),
    set: (key: string, value: JsonValue) =>
      ipcRenderer.invoke("settings-set", key, value),
    delete: (key: string) => ipcRenderer.invoke("settings-delete", key),
    app: {
      setUIScale: (scale: number) => ipcRenderer.invoke("set-ui-scale", scale),
      getUIScale: () => APISetup.settings.getNumber("zoomLevel", 0),
      setTrackerKeyBindings: (value: number) =>
        ipcRenderer.invoke("set-tracker-keybindings", value),
      getTrackerKeyBindings: () =>
        APISetup.settings.getNumber("trackerKeyBindings", 0),
    },
  },
  dialog: {
    chooseDirectory: (): Promise<string | undefined> =>
      ipcRenderer.invoke("open-directory-picker"),
    chooseFile: (): Promise<string | undefined> =>
      ipcRenderer.invoke("open-file-picker"),
  },
  project: {
    getRecentProjects: (): Promise<string[]> =>
      ipcRenderer.invoke("get-recent-projects"),
    clearRecentProjects: () => ipcRenderer.invoke("clear-recent-projects"),
    openProjectPicker: () => ipcRenderer.send("open-project-picker"),
    openProject: (projectPath: string) =>
      ipcRenderer.send("open-project", { projectPath }),
    createProject: (input: CreateProjectInput) =>
      ipcRenderer.invoke("create-project", input),
  },
};

export default APISetup;
