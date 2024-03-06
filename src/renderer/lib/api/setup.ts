import { ipcRenderer, IpcRendererEvent, webFrame } from "electron";
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
import type {
  BuildType,
  ProjectExportType,
} from "store/features/buildGame/buildGameActions";
import type { EngineFieldSchema } from "store/features/engine/engineState";
import type { ProjectData } from "store/features/project/projectActions";
import type { SettingsState } from "store/features/settings/settingsState";
import type {
  Background,
  SpriteSheetData,
} from "shared/lib/entities/entitiesTypes";
import type { BackgroundInfo } from "lib/helpers/validation";
import type { Song } from "shared/lib/uge/song/Song";
import type { PrecompiledSpriteSheetData } from "lib/compiler/compileSprites";
import type { BackgroundAssetData } from "lib/project/loadBackgroundData";
import type { SpriteAssetData } from "lib/project/loadSpriteData";
import type { MusicAssetData } from "lib/project/loadMusicData";
import type { SoundAssetData } from "lib/project/loadSoundData";
import type { FontAssetData } from "lib/project/loadFontData";
import type { AvatarAssetData } from "lib/project/loadAvatarData";
import type { EmoteAssetData } from "lib/project/loadEmoteData";
import type { EngineFieldSchemaLookup } from "lib/project/engineFields";
import type { NavigationSection } from "store/features/navigation/navigationState";
import type { MenuZoomType } from "menu";
import type { ScriptEventDef } from "lib/project/loadScriptEvents";
import type { Dictionary } from "@reduxjs/toolkit";

interface L10NLookup {
  [key: string]: string | boolean | undefined;
}

export type BuildOptions = {
  buildType: "rom" | "web" | "pocket";
  profile: boolean;
  engineFields: EngineFieldSchema[];
  exportBuild: boolean;
};

const createSubscribeAPI = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends (event: IpcRendererEvent, ...args: any[]) => void
>(
  channel: string
) => {
  return {
    on: (listener: T) => {
      ipcRenderer.on(channel, listener);
    },
    off: (listener: T) => {
      ipcRenderer.off(channel, listener);
    },
    once: (listener: T) => {
      ipcRenderer.once(channel, listener);
    },
  };
};

const createWatchSubscribeAPI = <T>(channel: string) => {
  return {
    changed: createSubscribeAPI<
      (event: IpcRendererEvent, filename: string, data: T) => void
    >(`${channel}:changed`),
    removed: createSubscribeAPI<
      (
        event: IpcRendererEvent,
        filename: string,
        plugin: string | undefined
      ) => void
    >(`${channel}:removed`),
  };
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
    setZoomLevel: (level: number) => webFrame.setZoomLevel(level),
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
    confirmReplaceCustomEvent: (name: string): Promise<number> =>
      ipcRenderer.invoke("dialog:confirm-replace-custom-event", name),
    confirmUnsavedChangesTrackerDialog: (name: string): Promise<number> =>
      ipcRenderer.invoke("dialog:confirm-tracker-unsaved", name),
    migrateWarning: (path: string) =>
      ipcRenderer.invoke("dialog:migrate-warning", path),
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
    getBackgroundInfo: (
      background: Background,
      is360: boolean
    ): Promise<BackgroundInfo> =>
      ipcRenderer.invoke("project:get-background-info", background, is360),
    addFile: (filename: string): Promise<void> =>
      ipcRenderer.invoke("project:add-file", filename),
    loadProject: (): Promise<{
      data: ProjectData;
      scriptEventDefs: Dictionary<ScriptEventDef>;
      modifiedSpriteIds: string[];
    }> => ipcRenderer.invoke("project:load"),
    saveProject: (data: ProjectData): Promise<void> =>
      ipcRenderer.invoke("project:save", data),
    saveProjectAs: (filename: string, data: ProjectData): Promise<void> =>
      ipcRenderer.invoke("project:save-as", filename, data),
    setModified: () => ipcRenderer.invoke("project:set-modified"),
    setUnmodified: () => ipcRenderer.invoke("project:set-unmodified"),
  },
  music: {
    openMusic: (sfx?: string) => ipcRenderer.send("open-music", sfx),
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
    playUGE: (filename: string): Promise<void> =>
      ipcRenderer.invoke("music:play-uge", filename),
  },
  soundfx: {
    playWav: (filename: string): Promise<void> =>
      ipcRenderer.invoke("sfx:play-wav", filename),
    playVGM: (filename: string): Promise<void> =>
      ipcRenderer.invoke("sfx:play-vgm", filename),
    playFXHammer: (filename: string, effectIndex: number): Promise<void> =>
      ipcRenderer.invoke("sfx:play-fxhammer", filename, effectIndex),
  },
  tracker: {
    addNewUGEFile: (path: string): Promise<string> =>
      ipcRenderer.invoke("tracker:new", path),
    loadUGEFile: (path: string): Promise<Song | null> =>
      ipcRenderer.invoke("tracker:load", path),
    saveUGEFile: (song: Song): Promise<void> =>
      ipcRenderer.invoke("tracker:save", song),
  },
  sprite: {
    compileSprite: (
      spriteData: SpriteSheetData
    ): Promise<PrecompiledSpriteSheetData> =>
      ipcRenderer.invoke("sprite:compile", spriteData),
  },
  clipboard: {
    addPasteInPlaceListener: (listener: () => void) =>
      ipcRenderer.on("paste-in-place", listener),
    removePasteInPlaceListener: (listener: () => void) =>
      ipcRenderer.removeListener("paste-in-place", listener),
    readText: (): Promise<string> => ipcRenderer.invoke("clipboard:read-text"),
    readBuffer: async (format: string): Promise<Buffer> =>
      Buffer.from(await ipcRenderer.invoke("clipboard:read-buffer", format)),
    writeText: (value: string): Promise<void> =>
      ipcRenderer.invoke("clipboard:write-text", value),
    writeBuffer: (format: string, buffer: Buffer): Promise<void> =>
      ipcRenderer.invoke("clipboard:write-buffer", format, buffer),
  },
  events: {
    menu: {
      saveProject:
        createSubscribeAPI<(event: IpcRendererEvent) => void>(
          "menu:save-project"
        ),
      saveProjectAs: createSubscribeAPI<
        (event: IpcRendererEvent, filename: string) => void
      >("menu:save-project-as"),
      onSaveAndCloseProject: createSubscribeAPI<
        (event: IpcRendererEvent) => void
      >("menu:save-project-and-close"),
      undo: createSubscribeAPI<(event: IpcRendererEvent) => void>("menu:undo"),
      redo: createSubscribeAPI<(event: IpcRendererEvent) => void>("menu:redo"),
      pasteInPlace: createSubscribeAPI<(event: IpcRendererEvent) => void>(
        "menu:paste-in-place"
      ),
      setSection:
        createSubscribeAPI<
          (event: IpcRendererEvent, section: NavigationSection) => void
        >("menu:section"),
      reloadAssets:
        createSubscribeAPI<(event: IpcRendererEvent) => void>(
          "menu:reload-assets"
        ),
      zoom: createSubscribeAPI<
        (event: IpcRendererEvent, zoom: MenuZoomType) => void
      >("menu:zoom"),
      run: createSubscribeAPI<(event: IpcRendererEvent) => void>("menu:run"),
      build:
        createSubscribeAPI<
          (event: IpcRendererEvent, buildType: BuildType) => void
        >("menu:build"),
      ejectEngine:
        createSubscribeAPI<(event: IpcRendererEvent) => void>(
          "menu:eject-engine"
        ),
      exportProject: createSubscribeAPI<
        (event: IpcRendererEvent, exportType: ProjectExportType) => void
      >("menu:export-project"),
      pluginRun:
        createSubscribeAPI<(event: IpcRendererEvent, pluginId: string) => void>(
          "menu:plugin-run"
        ),
    },
    settings: {
      uiScaleChanged: createSubscribeAPI<
        (event: IpcRendererEvent, scale: number) => void
      >("setting:ui-scale:changed"),
      trackerKeyBindingsChanged: createSubscribeAPI<
        (event: IpcRendererEvent, value: number) => void
      >("setting:tracker-keybindings:changed"),
      settingChanged:
        createSubscribeAPI<
          <K extends keyof SettingsState>(
            event: IpcRendererEvent,
            setting: K,
            value: SettingsState[K]
          ) => void
        >("setting:changed"),
    },
    watch: {
      sprite: createWatchSubscribeAPI<SpriteAssetData>("watch:sprite"),
      background:
        createWatchSubscribeAPI<BackgroundAssetData>("watch:background"),
      music: createWatchSubscribeAPI<MusicAssetData>("watch:music"),
      sound: createWatchSubscribeAPI<SoundAssetData>("watch:sound"),
      font: createWatchSubscribeAPI<FontAssetData>("watch:font"),
      avatar: createWatchSubscribeAPI<AvatarAssetData>("watch:avatar"),
      emote: createWatchSubscribeAPI<EmoteAssetData>("watch:emote"),
      ui: createWatchSubscribeAPI<never>("watch:ui"),
      engineSchema: {
        changed: createSubscribeAPI<
          (
            event: IpcRendererEvent,
            fields: EngineFieldSchema[],
            schemaLookup: EngineFieldSchemaLookup
          ) => void
        >("watch:engineFields:changed"),
      },
    },
  },
};

export default APISetup;
