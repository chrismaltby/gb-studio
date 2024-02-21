import { ipcRenderer, IpcRendererEvent } from "electron";
import type { CreateProjectInput } from "lib/project/createProject";
import type {
  MusicDataPacket,
  MusicDataReceivePacket,
} from "shared/lib/music/types";
import type { ThemeId } from "shared/lib/theme";
import {
  ensurePromisedNumber,
  ensurePromisedString,
  JsonValue,
} from "shared/types";
import type { ProjectExportType } from "store/features/buildGame/buildGameActions";
import type { EngineFieldSchema } from "store/features/engine/engineState";
import type { ProjectData } from "store/features/project/projectActions";
import type { SettingsState } from "store/features/settings/settingsState";

interface L10NLookup {
  [key: string]: string | boolean | undefined;
}

export type BuildOptions = {
  buildType: "rom" | "web" | "pocket";
  profile: boolean;
  engineFields: EngineFieldSchema[];
  exportBuild: boolean;
};

const APISetup = {
  platform: process.platform,
  test: () => console.log("Hello World"),
  app: {
    openExternal: (path: string) => ipcRenderer.invoke("open-external", path),
    openHelp: (helpPage: string) => ipcRenderer.invoke("open-help", helpPage),
    openFolder: (path: string) => ipcRenderer.invoke("open-folder", path),
    openImageFile: (path: string) => ipcRenderer.invoke("open-image", path),
    openModFile: (path: string) => ipcRenderer.invoke("open-mod", path),
    openFile: (path: string) => ipcRenderer.invoke("open-file", path),
    getIsFullScreen: (): Promise<boolean> =>
      ipcRenderer.invoke("get-is-full-screen"),
    onIsFullScreenChange: (
      listener: (event: IpcRendererEvent, isFullScreen: boolean) => void
    ) => ipcRenderer.on("is-full-screen-changed", listener),
    deleteBuildCache: () => ipcRenderer.invoke("build:delete-cache"),
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
    showError: (title: string, content: string) =>
      ipcRenderer.invoke("dialog:show-error", title, content),
    confirmEnableColorDialog: (): Promise<number | false> =>
      ipcRenderer.invoke("dialog:confirm-color"),
    confirmDeleteCustomEvent: (
      name: string,
      sceneNames: string[],
      count: number
    ): Promise<number | false> =>
      ipcRenderer.invoke(
        "dialog:confirm-delete-custom-event",
        name,
        sceneNames,
        count
      ),
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
    initProjectSettings: (settings: SettingsState) =>
      ipcRenderer.send("project-loaded", settings),
    setShowNavigator: (value: boolean) =>
      ipcRenderer.send("set-show-navigator", value),
    close: () => ipcRenderer.invoke("close-project"),
    build: (data: ProjectData, options: BuildOptions) =>
      ipcRenderer.invoke("project:build", data, options),
    buildCancel: () => ipcRenderer.invoke("project:build-cancel"),
    onBuildLog: (
      listener: (event: IpcRendererEvent, message: string) => void
    ) => ipcRenderer.on("build:log", listener),
    onBuildError: (
      listener: (event: IpcRendererEvent, message: string) => void
    ) => ipcRenderer.on("build:error", listener),
    ejectEngine: () => ipcRenderer.invoke("project:engine-eject"),
    exportProject: (
      data: ProjectData,
      engineFields: EngineFieldSchema[],
      exportType: ProjectExportType
    ) => ipcRenderer.invoke("project:export", data, engineFields, exportType),
  },
  music: {
    openMusic: () => ipcRenderer.send("open-music"),
    closeMusic: () => ipcRenderer.send("close-music"),
    sendMusicData: (data: MusicDataPacket) =>
      ipcRenderer.send("music-data-send", data),
    receiveMusicData: (data: MusicDataReceivePacket) =>
      ipcRenderer.send("music-data-receive", data),
    musicDataSubscribe: (
      listener: (event: IpcRendererEvent, data: MusicDataPacket) => void
    ) => ipcRenderer.on("music-data", listener),
    musicDataUnsubscribe: (
      listener: (event: IpcRendererEvent, data: MusicDataPacket) => void
    ) => ipcRenderer.removeListener("music-data", listener),
  },
  clipboard: {
    addPasteInPlaceListener: (listener: () => void) =>
      ipcRenderer.on("paste-in-place", listener),
    removePasteInPlaceListener: (listener: () => void) =>
      ipcRenderer.removeListener("paste-in-place", listener),
    readText: (): Promise<string> => ipcRenderer.invoke("clipboard-read-text"),
  },
};

export default APISetup;
