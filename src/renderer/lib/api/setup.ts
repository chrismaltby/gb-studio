import { ipcRenderer } from "electron";
import type { CreateProjectInput } from "lib/project/createProject";
import type { ThemeId } from "shared/lib/theme";
import type { JsonValue } from "shared/types";

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
    getDocumentsPath: () => ipcRenderer.invoke("get-documents-path"),
    getTmpPath: () => ipcRenderer.invoke("get-tmp-path"),
  },
  settings: {
    get: (key: string): Promise<unknown> =>
      ipcRenderer.invoke("settings-get", key),
    set: (key: string, value: JsonValue) =>
      ipcRenderer.invoke("settings-set", key, value),
    delete: (key: string) => ipcRenderer.invoke("settings-delete", key),
  },
  dialog: {
    chooseDirectory: (): Promise<string | undefined> =>
      ipcRenderer.invoke("open-directory-picker"),
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
