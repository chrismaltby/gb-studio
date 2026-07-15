import { ipcRenderer, IpcRendererEvent, webFrame, webUtils } from "electron";
import type { CreateProjectInput } from "lib/project/createProject";
import type {
  MusicDataPacket,
  MusicDataReceivePacket,
} from "shared/lib/music/types";
import type { MusicMidiState } from "shared/lib/music/midi";
import {
  ensurePromisedNumber,
  ensurePromisedString,
  JsonValue,
} from "shared/types";
import type {
  BuildType,
  ProjectExportType,
} from "store/features/buildGame/buildGameActions";
import type { SettingsState } from "store/features/settings/settingsState";
import type { BackgroundInfo, SceneTilemapInfo } from "lib/helpers/validation";
import type { Song } from "shared/lib/uge/types";
import type { UGIInstrument } from "shared/lib/uge/ugiHelper";
import type { PrecompiledSpriteSheetData } from "lib/compiler/compileSprites";
import type { NavigationSection } from "store/features/navigation/navigationState";
import type { ScriptEventDefs } from "shared/lib/scripts/scriptDefHelpers";
import type { MenuZoomType } from "shared/lib/menu/types";
import type {
  BackgroundPreviewType,
  DebuggerDataPacket,
} from "shared/lib/debugger/types";
import type { SceneMapData, VariableMapData } from "lib/compiler/compileData";
import type { UsageData } from "lib/compiler/romUsage";
import type { Asset, AssetType } from "shared/lib/helpers/assets";
import type { Patrons } from "scripts/fetchPatrons";
import type { LoadProjectResult } from "lib/project/loadProjectData";
import {
  AvatarResourceAsset,
  BackgroundAsset,
  ColorCorrectionSetting,
  ColorModeSetting,
  CompressedBackgroundResourceAsset,
  CompressedTilesetResourceAsset,
  Constant,
  EmoteResourceAsset,
  FontResourceAsset,
  MusicAsset,
  MusicResourceAsset,
  Tileset,
  ProjectResources,
  SoundResourceAsset,
  Sprite,
  SpriteModeSetting,
  SpriteResourceAsset,
  TilesetAsset,
  WriteResourcesPatch,
} from "shared/lib/resources/types";
import type {
  PluginRepositoryEntry,
  PluginRepositoryMetadata,
  InstalledPluginData,
  PluginType,
} from "lib/pluginManager/types";
import type { ThemeInterface } from "ui/theme/ThemeInterface";
import type { TemplatePlugin } from "lib/templates/templateManager";
import { EngineSchema } from "lib/project/loadEngineSchema";
import { HexPalette } from "shared/lib/tiles/autoColor";
import { ScriptDataTable } from "shared/lib/scriptDataTable/types";
import type { WebTemplateInfo } from "shared/lib/webTemplates/types";
import {
  getDeepActiveElement as getActiveElement,
  canPerformSelectAll,
  performSelectAll,
} from "renderer/lib/helpers/dom";

interface L10NLookup {
  [key: string]: string | boolean | undefined;
}

export type BuildOptions = {
  buildType: "rom" | "web" | "pocket";
  engineSchema: EngineSchema;
  exportBuild: boolean;
  debugEnabled?: boolean;
};

export type RecentProjectData = {
  name: string;
  dir: string;
  path: string;
};

export interface ProjectWindowMenuState {
  showCollisions: SettingsState["showCollisions"];
  showConnections: SettingsState["showConnections"];
  showNavigator: SettingsState["showNavigator"];
  showSceneScreenGrid: SettingsState["showSceneScreenGrid"];
  navigationSection: NavigationSection;
}

const createSubscribeAPI = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends (event: IpcRendererEvent, ...args: any[]) => void,
>(
  channel: string,
) => {
  return {
    subscribe: (listener: T) => {
      ipcRenderer.on(channel, listener);
      return () => {
        ipcRenderer.off(channel, listener);
      };
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
    renamed: createSubscribeAPI<
      (
        event: IpcRendererEvent,
        oldFilename: string,
        newFilename: string,
        plugin: string | undefined,
      ) => void
    >(`${channel}:renamed`),
    removed: createSubscribeAPI<
      (
        event: IpcRendererEvent,
        filename: string,
        plugin: string | undefined,
      ) => void
    >(`${channel}:removed`),
  };
};

const selectAllListeners = new Set<() => void>();

ipcRenderer.on("menu:select-all", () => {
  const activeElement = getActiveElement();

  if (activeElement && canPerformSelectAll(activeElement)) {
    performSelectAll(activeElement);
    return;
  }

  selectAllListeners.forEach((listener) => {
    listener();
  });
});

const APISetup = {
  platform: process.platform,
  env: "electron",
  test: () => console.log("Hello World"),
  app: {
    openExternal: (path: string) => ipcRenderer.invoke("open-external", path),
    openHelp: (helpPage: string) => ipcRenderer.invoke("open-help", helpPage),
    openFolder: (path: string) => ipcRenderer.invoke("open-folder", path),
    openImageFile: (path: string) => ipcRenderer.invoke("open-image", path),
    openModFile: (path: string) => ipcRenderer.invoke("open-mod", path),
    openFile: (path: string) => ipcRenderer.invoke("open-file", path),
    getIsFullScreen: (): Promise<boolean> =>
      ipcRenderer.invoke("app:get-is-full-screen"),
    deleteBuildCache: () => ipcRenderer.invoke("build:delete-cache"),
    setZoomLevel: (level: number) => webFrame.setZoomLevel(level),
    getPatrons: (): Promise<Patrons> => ipcRenderer.invoke("app:get-patrons"),
    showProjectWindow: () => ipcRenderer.invoke("app:show-project-window"),
  },
  l10n: {
    getL10NStrings: (): Promise<L10NLookup> =>
      ipcRenderer.invoke("get-l10n-strings"),
  },
  theme: {
    getTheme: (): Promise<ThemeInterface> => ipcRenderer.invoke("get-theme"),
    onChange: (callback: (theme: ThemeInterface) => void) =>
      ipcRenderer.on("update-theme", (_, theme: ThemeInterface) =>
        callback(theme),
      ),
  },
  templates: {
    getTemplatesList: (): Promise<TemplatePlugin[]> =>
      ipcRenderer.invoke("templates:list"),
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
      count: number,
    ): Promise<number | false> =>
      ipcRenderer.invoke(
        "dialog:confirm-delete-custom-event",
        name,
        sceneNames,
        count,
      ),
    confirmReplaceCustomEvent: (name: string): Promise<number> =>
      ipcRenderer.invoke("dialog:confirm-replace-custom-event", name),
    confirmDeletePrefab: (
      name: string,
      count: number,
    ): Promise<number | false> =>
      ipcRenderer.invoke("dialog:confirm-delete-prefab", name, count),
    confirmReplacePrefab: (name: string): Promise<number | false> =>
      ipcRenderer.invoke("dialog:confirm-replace-prefab", name),
    confirmUnpackPrefab: (): Promise<number | false> =>
      ipcRenderer.invoke("dialog:confirm-unpack-prefab"),
    confirmDeletePreset: (name: string): Promise<number | false> =>
      ipcRenderer.invoke("dialog:confirm-delete-preset", name),
    confirmApplyPreset: (): Promise<number | false> =>
      ipcRenderer.invoke("dialog:confirm-apply-preset"),
    confirmDeleteConstant: (
      name: string,
      usesNames: string[],
    ): Promise<number | false> =>
      ipcRenderer.invoke("dialog:confirm-delete-constant", name, usesNames),
    confirmUnsavedChangesTrackerDialog: (name: string): Promise<number> =>
      ipcRenderer.invoke("dialog:confirm-tracker-unsaved", name),
    migrateWarning: (path: string) =>
      ipcRenderer.invoke("dialog:migrate-warning", path),
  },
  project: {
    getRecentProjects: (): Promise<RecentProjectData[]> =>
      ipcRenderer.invoke("get-recent-projects"),
    removeRecentProject: (path: string) =>
      ipcRenderer.invoke("remove-recent-project", path),
    clearRecentProjects: () => ipcRenderer.invoke("clear-recent-projects"),
    openProjectPicker: () => ipcRenderer.invoke("project:open-project-picker"),
    openProject: (projectPath: string): Promise<boolean> =>
      ipcRenderer.invoke("project:open", { projectPath }),
    getResourceChecksums: (): Promise<Record<string, string>> =>
      ipcRenderer.invoke("project:get-resource-checksums"),
    createProject: (input: CreateProjectInput) =>
      ipcRenderer.invoke("create-project", input),
    updateProjectWindowMenu: (state: ProjectWindowMenuState) =>
      ipcRenderer.invoke("project:update-project-window-menu", state),
    close: () => ipcRenderer.invoke("close-project"),
    build: (data: ProjectResources, options: BuildOptions) =>
      ipcRenderer.invoke("project:build", data, options),
    buildCancel: () => ipcRenderer.invoke("project:build-cancel"),
    onBuildLog: (
      listener: (event: IpcRendererEvent, message: string) => void,
    ) => ipcRenderer.on("build:log", listener),
    onBuildError: (
      listener: (event: IpcRendererEvent, message: string) => void,
    ) => ipcRenderer.on("build:error", listener),
    ejectEngine: () => ipcRenderer.invoke("project:engine-eject"),
    exportProject: (
      data: ProjectResources,
      engineSchema: EngineSchema,
      exportType: ProjectExportType,
    ) => ipcRenderer.invoke("project:export", data, engineSchema, exportType),
    getBackgroundInfo: (
      background: BackgroundAsset,
      tileset: TilesetAsset | undefined,
      is360: boolean,
      uiPalette: HexPalette | undefined,
      colorMode: ColorModeSetting,
      colorCorrection: ColorCorrectionSetting,
      autoTileFlipEnabled: boolean,
    ): Promise<BackgroundInfo> =>
      ipcRenderer.invoke(
        "project:get-background-info",
        background,
        tileset,
        is360,
        uiPalette,
        colorMode,
        colorCorrection,
        autoTileFlipEnabled,
      ),
    getSceneTilemapInfo: (
      scene: import("shared/lib/entities/entitiesTypes").SceneNormalized,
      tilesets: Tileset[],
      colorMode: ColorModeSetting,
      autoTileFlipEnabled: boolean,
    ): Promise<SceneTilemapInfo> =>
      ipcRenderer.invoke(
        "project:get-scene-tilemap-info",
        scene,
        tilesets,
        colorMode,
        autoTileFlipEnabled,
      ),
    extractBackgroundMonoTiles: (
      background: BackgroundAsset,
      uiPalette: HexPalette | undefined,
      colorCorrection: ColorCorrectionSetting,
    ): Promise<BackgroundInfo> =>
      ipcRenderer.invoke(
        "project:extract-background-mono-tiles",
        background,
        uiPalette,
        colorCorrection,
      ),
    addFile: (file: File): Promise<void> =>
      ipcRenderer.invoke("project:add-file", webUtils.getPathForFile(file)),
    loadProject: (): Promise<LoadProjectResult> =>
      ipcRenderer.invoke("project:load"),
    saveProject: (data: WriteResourcesPatch): Promise<void> =>
      ipcRenderer.invoke("project:save", data),
    setModified: () => ipcRenderer.invoke("project:set-modified"),
    setUnmodified: () => ipcRenderer.invoke("project:set-unmodified"),
    renameAsset: (
      type: AssetType,
      asset: Asset,
      filename: string,
    ): Promise<boolean> =>
      ipcRenderer.invoke("project:rename-asset", type, asset, filename),
    removeAsset: (type: AssetType, asset: Asset): Promise<boolean> =>
      ipcRenderer.invoke("project:remove-asset", type, asset),
    getWebTemplates: (): Promise<WebTemplateInfo[]> =>
      ipcRenderer.invoke("project:web-template:list"),
    ejectWebTemplate: (): Promise<WebTemplateInfo[] | undefined> =>
      ipcRenderer.invoke("project:web-template:eject"),
  },
  script: {
    getScriptAutoLabel: (
      cmd: string,
      args: Record<string, unknown>,
    ): Promise<string> =>
      ipcRenderer.invoke("script:get-auto-label", cmd, args),
    scriptEventPostUpdateFn: (
      cmd: string,
      fieldKey: string,
      args: Record<string, unknown>,
      prevArgs: Record<string, unknown>,
    ): Promise<Record<string, unknown>> =>
      ipcRenderer.invoke(
        "script:post-update-fn",
        cmd,
        fieldKey,
        args,
        prevArgs,
      ),
    scriptEventUpdateFn: (
      cmd: string,
      fieldKey: string,
      value: unknown,
    ): Promise<unknown> =>
      ipcRenderer.invoke("script:update-fn", cmd, fieldKey, value),
  },
  dataTable: {
    exportCSV: (table: ScriptDataTable, constants: Constant[]): Promise<void> =>
      ipcRenderer.invoke("data-table:export-csv", table, constants),
    importCSV: (constants: Constant[]): Promise<ScriptDataTable | undefined> =>
      ipcRenderer.invoke("data-table:import-csv", constants),
  },
  music: {
    openMusic: (sfx?: string) => ipcRenderer.invoke("music:open", sfx),
    closeMusic: () => ipcRenderer.invoke("music:close"),
    sendToMusicWindow: (data: MusicDataPacket) =>
      ipcRenderer.send("music:data-send", data),
    sendToProjectWindow: (data: MusicDataReceivePacket) =>
      ipcRenderer.send("music:data-receive", data),
    updateMidiInputMenuState: (state: MusicMidiState) =>
      ipcRenderer.send("music:midi-menu-state", state),
    playUGE: (filename: string): Promise<void> =>
      ipcRenderer.invoke("music:play-uge", filename),
    playMOD: (filename: string, speedConversion: boolean): Promise<void> =>
      ipcRenderer.invoke("music:play-mod", filename, speedConversion),
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
    addNewUGEFile: (path: string): Promise<MusicResourceAsset> =>
      ipcRenderer.invoke("tracker:new", path),
    loadUGEFile: (path: string): Promise<Song> =>
      ipcRenderer.invoke("tracker:load", path),
    saveUGEFile: (song: Song): Promise<void> =>
      ipcRenderer.invoke("tracker:save", song),
    convertModToUge: (asset: MusicAsset): Promise<MusicResourceAsset> =>
      ipcRenderer.invoke("tracker:convert-mod", asset),
    exportInstrument: (instrument: UGIInstrument): Promise<void> =>
      ipcRenderer.invoke("tracker:export-instrument", instrument),
    importInstrument: (): Promise<UGIInstrument | null> =>
      ipcRenderer.invoke("tracker:import-instrument"),
    exportWave: (wave: Uint8Array, suggestedName: string): Promise<void> =>
      ipcRenderer.invoke(
        "tracker:export-wave",
        Array.from(wave),
        suggestedName,
      ),
    importWave: (): Promise<Uint8Array | null> =>
      ipcRenderer
        .invoke("tracker:import-wave")
        .then((result: number[] | null) =>
          result ? new Uint8Array(result) : null,
        ),
  },
  sprite: {
    compileSprite: (
      spriteData: Sprite,
      defaultSpriteMode: SpriteModeSetting,
    ): Promise<PrecompiledSpriteSheetData> =>
      ipcRenderer.invoke("sprite:compile", spriteData, defaultSpriteMode),
  },
  clipboard: {
    readText: (): Promise<string> => ipcRenderer.invoke("clipboard:read-text"),
    readBuffer: async (format: string): Promise<Buffer> =>
      Buffer.from(await ipcRenderer.invoke("clipboard:read-buffer", format)),
    writeText: (value: string): Promise<void> =>
      ipcRenderer.invoke("clipboard:write-text", value),
    writeBuffer: (format: string, buffer: Buffer): Promise<void> =>
      ipcRenderer.invoke("clipboard:write-buffer", format, buffer),
  },
  debugger: {
    pause: () => ipcRenderer.invoke("debugger:pause"),
    resume: () => ipcRenderer.invoke("debugger:resume"),
    setPauseOnScriptChanged: (enabled: boolean) =>
      ipcRenderer.invoke("debugger:pause-on-script", enabled),
    setPauseOnWatchVariableChanged: (enabled: boolean) =>
      ipcRenderer.invoke("debugger:pause-on-var", enabled),
    setGlobal: (symbol: string, value: number) =>
      ipcRenderer.invoke("debugger:set-global", symbol, value),
    step: () => ipcRenderer.invoke("debugger:step"),
    stepFrame: () => ipcRenderer.invoke("debugger:step-frame"),
    setBreakpoints: (breakpoints: string[]) =>
      ipcRenderer.invoke("debugger:set-breakpoints", breakpoints),
    setWatchedVariableIds: (variableIds: string[]) =>
      ipcRenderer.invoke("debugger:set-watched", variableIds),
    setBackgroundPreviewType: (type: BackgroundPreviewType) =>
      ipcRenderer.invoke("debugger:set-background-preview-type", type),
    sendToProjectWindow: (data: DebuggerDataPacket) =>
      ipcRenderer.send("debugger:data-receive", data),
  },
  pluginManager: {
    getPluginsList: (force?: boolean): Promise<PluginRepositoryMetadata[]> =>
      ipcRenderer.invoke("plugins:fetch-list", force),
    getPluginRepos: (): Promise<PluginRepositoryEntry[]> =>
      ipcRenderer.invoke("plugins:list-repos"),
    addPluginRepo: (url: string) => ipcRenderer.invoke("plugins:add-repo", url),
    removePluginRepo: (url: string) =>
      ipcRenderer.invoke("plugins:remove-repo", url),
    addPlugin: (id: string, repoId: string) =>
      ipcRenderer.invoke("plugins:add", id, repoId),
    removePlugin: (id: string, pluginType: PluginType) =>
      ipcRenderer.invoke("plugins:remove", id, pluginType),
    getInstalledPlugins: (): Promise<InstalledPluginData[]> =>
      ipcRenderer.invoke("plugins:get-installed"),
  },
  events: {
    menu: {
      saveProject:
        createSubscribeAPI<(event: IpcRendererEvent) => void>(
          "menu:save-project",
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
        "menu:paste-in-place",
      ),
      selectAll: {
        subscribe: (listener: () => void) => {
          selectAllListeners.add(listener);
          return () => {
            selectAllListeners.delete(listener);
          };
        },
      },
      midiInputToggle: createSubscribeAPI<(event: IpcRendererEvent) => void>(
        "menu:midi-input-toggle",
      ),
      midiInputSelect: createSubscribeAPI<
        (event: IpcRendererEvent, inputId: string) => void
      >("menu:midi-input-select"),
      setSection:
        createSubscribeAPI<
          (event: IpcRendererEvent, section: NavigationSection) => void
        >("menu:section"),
      reloadAssets:
        createSubscribeAPI<(event: IpcRendererEvent) => void>(
          "menu:reload-assets",
        ),
      zoom: createSubscribeAPI<
        (event: IpcRendererEvent, zoom: MenuZoomType) => void
      >("menu:zoom"),
      run: createSubscribeAPI<
        (event: IpcRendererEvent, debugEnabled: boolean) => void
      >("menu:run"),
      build:
        createSubscribeAPI<
          (event: IpcRendererEvent, buildType: BuildType) => void
        >("menu:build"),
      ejectEngine:
        createSubscribeAPI<(event: IpcRendererEvent) => void>(
          "menu:eject-engine",
        ),
      ejectWebTemplate: createSubscribeAPI<(event: IpcRendererEvent) => void>(
        "menu:eject-web-template",
      ),
      exportProject: createSubscribeAPI<
        (event: IpcRendererEvent, exportType: ProjectExportType) => void
      >("menu:export-project"),
      pluginRun:
        createSubscribeAPI<(event: IpcRendererEvent, pluginId: string) => void>(
          "menu:plugin-run",
        ),
    },
    app: {
      isFullScreenChanged: createSubscribeAPI<
        (event: IpcRendererEvent, isFullScreen: boolean) => void
      >("app:is-full-screen:changed"),
    },
    music: {
      data: createSubscribeAPI<
        (event: IpcRendererEvent, data: MusicDataPacket) => void
      >("music:data"),
      response:
        createSubscribeAPI<
          (event: IpcRendererEvent, data: MusicDataReceivePacket) => void
        >("music:response"),
    },
    debugger: {
      data: createSubscribeAPI<
        (event: IpcRendererEvent, data: DebuggerDataPacket) => void
      >("debugger:data"),
      symbols: createSubscribeAPI<
        (
          event: IpcRendererEvent,
          data: {
            variableMap: Record<string, VariableMapData>;
            sceneMap: Record<string, SceneMapData>;
            gbvmScripts: Record<string, string>;
          },
        ) => void
      >("debugger:symbols"),
      disconnected: createSubscribeAPI<(event: IpcRendererEvent) => void>(
        "debugger:disconnected",
      ),
      romusage:
        createSubscribeAPI<(event: IpcRendererEvent, data: UsageData) => void>(
          "debugger:romusage",
        ),
    },
    project: {
      saveProgress: createSubscribeAPI<
        (event: IpcRendererEvent, completed: number, total: number) => void
      >("project:save-progress"),
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
            value: SettingsState[K],
          ) => void
        >("setting:changed"),
    },
    templates: {
      templatesListChanged: createSubscribeAPI<
        (event: IpcRendererEvent, templates: TemplatePlugin[]) => void
      >("templates:list:changed"),
    },
    watch: {
      sprite: createWatchSubscribeAPI<SpriteResourceAsset>("watch:sprite"),
      background:
        createWatchSubscribeAPI<CompressedBackgroundResourceAsset>(
          "watch:background",
        ),
      music: createWatchSubscribeAPI<MusicResourceAsset>("watch:music"),
      sound: createWatchSubscribeAPI<SoundResourceAsset>("watch:sound"),
      font: createWatchSubscribeAPI<FontResourceAsset>("watch:font"),
      avatar: createWatchSubscribeAPI<AvatarResourceAsset>("watch:avatar"),
      emote: createWatchSubscribeAPI<EmoteResourceAsset>("watch:emote"),
      tileset:
        createWatchSubscribeAPI<CompressedTilesetResourceAsset>(
          "watch:tileset",
        ),
      ui: createWatchSubscribeAPI<never>("watch:ui"),
      webTemplates: {
        changed: createSubscribeAPI<
          (event: IpcRendererEvent, templates: WebTemplateInfo[]) => void
        >("watch:webTemplates:changed"),
      },
      engineSchema: {
        changed: createSubscribeAPI<
          (event: IpcRendererEvent, engineSchema: EngineSchema) => void
        >("watch:engineSchema:changed"),
      },
      scriptEventDefs: {
        changed: createSubscribeAPI<
          (event: IpcRendererEvent, scriptEventDefs: ScriptEventDefs) => void
        >("watch:scriptEventDefs:changed"),
      },
    },
  },
};

export default APISetup;
