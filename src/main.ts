import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  nativeTheme,
  clipboard,
  protocol,
} from "electron";
import windowStateKeeper from "electron-window-state";
import settings from "electron-settings";
import Path from "path";
import {
  copyFile,
  pathExists,
  readFile,
  remove,
  stat,
  statSync,
  move,
} from "fs-extra";
import menu, { setMenuItemChecked } from "./menu";
import { checkForUpdate } from "lib/helpers/updateChecker";
import switchLanguageDialog from "lib/electron/dialog/switchLanguageDialog";
import installExtension, {
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS,
} from "electron-devtools-installer";
import { ensureString, isString, isStringArray, JsonValue } from "shared/types";
import getTmp from "lib/helpers/getTmp";
import createProject, { CreateProjectInput } from "lib/project/createProject";
import open from "open";
import confirmEnableColorDialog from "lib/electron/dialog/confirmEnableColorDialog";
import confirmDeleteCustomEvent from "lib/electron/dialog/confirmDeleteCustomEvent";
import type { BuildOptions, RecentProjectData } from "renderer/lib/api/setup";
import buildProject, {
  cancelCompileStepsInProgress,
} from "lib/compiler/buildProject";
import copy from "lib/helpers/fsCopy";
import confirmEjectEngineDialog from "lib/electron/dialog/confirmEjectEngineDialog";
import confirmEjectEngineReplaceDialog from "lib/electron/dialog/confirmEjectEngineReplaceDialog";
import ejectEngineToDir from "lib/project/ejectEngineToDir";
import type { ProjectExportType } from "store/features/buildGame/buildGameActions";
import {
  assetsRoot,
  buildUUID,
  EMULATOR_MUTED_SETTING_KEY,
  LOCALE_SETTING_KEY,
  projectTemplatesRoot,
  THEME_SETTING_KEY,
} from "consts";
import type {
  Background,
  SpriteSheetData,
  Tileset,
} from "shared/lib/entities/entitiesTypes";
import { getBackgroundInfo } from "lib/helpers/validation";
import { writeFileWithBackupAsync } from "lib/helpers/fs/writeFileWithBackup";
import { guardAssetWithinProject } from "lib/helpers/assets";
import type { Song } from "shared/lib/uge/song/Song";
import { loadUGESong, saveUGESong } from "shared/lib/uge/ugeHelper";
import confirmUnsavedChangesTrackerDialog from "lib/electron/dialog/confirmUnsavedChangesTrackerDialog";
import type {
  MusicDataPacket,
  MusicDataReceivePacket,
} from "shared/lib/music/types";
import { compileFXHammerSingle } from "lib/compiler/sounds/compileFXHammer";
import { compileWav } from "lib/compiler/sounds/compileWav";
import { compileVGM } from "lib/compiler/sounds/compileVGM";
import {
  PrecompiledSpriteSheetData,
  compileSprite,
} from "lib/compiler/compileSprites";
import { Asset, AssetType, assetFilename } from "shared/lib/helpers/assets";
import toArrayBuffer from "lib/helpers/toArrayBuffer";
import { AssetFolder, potentialAssetFolders } from "lib/project/assets";
import confirmAssetFolder from "lib/electron/dialog/confirmAssetFolder";
import loadProjectData, {
  LoadProjectResult,
} from "lib/project/loadProjectData";
import saveProjectData from "lib/project/saveProjectData";
import migrateWarning from "lib/project/migrateWarning";
import confirmReplaceCustomEvent from "lib/electron/dialog/confirmReplaceCustomEvent";
import l10n, { getL10NData } from "shared/lib/lang/l10n";
import initElectronL10N, { getAppLocale } from "lib/lang/initElectronL10N";
import watchProject from "lib/project/watchProject";
import { loadBackgroundData } from "lib/project/loadBackgroundData";
import { loadSpriteData } from "lib/project/loadSpriteData";
import { loadMusicData } from "lib/project/loadMusicData";
import { loadSoundData } from "lib/project/loadSoundData";
import { loadFontData } from "lib/project/loadFontData";
import { loadAvatarData } from "lib/project/loadAvatarData";
import { loadEmoteData } from "lib/project/loadEmoteData";
import { loadTilesetData } from "lib/project/loadTilesetData";
import parseAssetPath from "shared/lib/assets/parseAssetPath";
import { getAutoLabel } from "shared/lib/scripts/autoLabel";
import loadAllScriptEventHandlers, {
  ScriptEventHandlers,
} from "lib/project/loadScriptEventHandlers";
import { cloneDictionary } from "lib/helpers/clone";
import { readDebuggerSymbols } from "lib/debugger/readDebuggerSymbols";
import {
  DebuggerDataPacket,
  DebuggerInitData,
} from "shared/lib/debugger/types";
import pickBy from "lodash/pickBy";
import keyBy from "lodash/keyBy";
import { fileExists } from "lib/helpers/fs/fileExists";
import confirmDeleteAsset from "lib/electron/dialog/confirmDeleteAsset";
import { getPatronsFromGithub } from "lib/credits/getPatronsFromGithub";
import {
  MusicResourceAsset,
  ProjectResources,
  SpriteModeSetting,
  WriteResourcesPatch,
} from "shared/lib/resources/types";
import { loadProjectResourceChecksums } from "lib/project/loadResourceChecksums";
import confirmDeletePrefab from "lib/electron/dialog/confirmDeletePrefab";
import confirmUnpackPrefab from "lib/electron/dialog/confirmUnpackPrefab";
import confirmReplacePrefab from "lib/electron/dialog/confirmReplacePrefab";
import romUsage from "lib/compiler/romUsage";
import { msToHumanTime } from "shared/lib/helpers/time";
import confirmDeletePreset from "lib/electron/dialog/confirmDeletePreset";
import confirmApplyPreset from "lib/electron/dialog/confirmApplyPreset";
import confirmDeleteConstant from "lib/electron/dialog/confirmDeleteConstant";
import {
  addPluginToProject,
  addUserRepo,
  getGlobalPluginsList,
  getReposList,
  getRepoUrlById,
  removePluginFromProject,
  removeUserRepo,
} from "lib/pluginManager/repo";
import confirmOpenURL from "lib/electron/dialog/confirmOpenURL";
import { getPluginsInProject } from "lib/pluginManager/project";
import {
  ensureGlobalPluginsPath,
  getGlobalPluginsPath,
  getPluginsInstalledGlobally,
  removeGlobalPlugin,
} from "lib/pluginManager/globalPlugins";
import { InstalledPluginData, PluginType } from "lib/pluginManager/types";
import watchGlobalPlugins from "lib/pluginManager/watchGlobalPlugins";
import { ThemeManager } from "lib/themes/themeManager";
import { isGlobalPluginType } from "shared/lib/plugins/pluginHelpers";
import { L10nManager } from "lib/lang/l10nManager";
import { TemplateManager } from "lib/templates/templateManager";
import { EngineSchema, loadEngineSchema } from "lib/project/loadEngineSchema";

declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const SPLASH_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const SPLASH_WINDOW_WEBPACK_ENTRY: string;
declare const PREFERENCES_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const PREFERENCES_WINDOW_WEBPACK_ENTRY: string;
declare const PLUGINS_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const PLUGINS_WINDOW_WEBPACK_ENTRY: string;
declare const MUSIC_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MUSIC_WINDOW_WEBPACK_ENTRY: string;
declare const GAME_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

type SplashTab = "info" | "new" | "recent";

// Stop app launching during squirrel install
// eslint-disable-next-line global-require
if (require("electron-squirrel-startup")) {
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let projectWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let preferencesWindow: BrowserWindow | null = null;
let pluginsWindow: BrowserWindow | null = null;
let playWindow: BrowserWindow | null = null;
let musicWindow: BrowserWindow | null;

let playWindowSgb = false;
let hasCheckedForUpdate = false;
let documentEdited = false;
let documentName = "";
let playWindowTitle = "";
let projectWindowCloseCancelled = false;
let keepOpen = false;
let projectPath = "";
let musicWindowInitialized = false;
let debuggerInitData: DebuggerInitData | null = null;
let stopWatchingFn: (() => void) | null = null;
let scriptEventHandlers: ScriptEventHandlers = {};

const themeManager = new ThemeManager(process.platform);
const l10nManager = new L10nManager();
const templateManager = new TemplateManager();

const isDevMode = !!process.execPath.match(/[\\/]electron/);

const validProjectExt = [".json", ".gbsproj"];

if (isDevMode) {
  app.whenReady().then(() => {
    installExtension([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS])
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log("An error occurred: ", err));
  });
}

export const createSplash = async (forceTab?: SplashTab) => {
  // Create the browser window.
  splashWindow = new BrowserWindow({
    width: 640,
    height: 430,
    useContentSize: true,
    resizable: false,
    maximizable: false,
    titleBarStyle: "hiddenInset",
    fullscreenable: false,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      devTools: isDevMode,
      preload: SPLASH_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });
  if (!splashWindow) return;

  splashWindow.setMenu(null);
  splashWindow.loadURL(`${SPLASH_WINDOW_WEBPACK_ENTRY}?tab=${forceTab || ""}`);

  splashWindow.webContents.on("did-finish-load", () => {
    setTimeout(() => {
      splashWindow?.show();
      if (!hasCheckedForUpdate) {
        hasCheckedForUpdate = true;
        checkForUpdate();
      }
    }, 40);
  });

  splashWindow.on("closed", () => {
    splashWindow = null;
  });
};

export const createPreferences = async () => {
  // Create the browser window.
  preferencesWindow = new BrowserWindow({
    width: 600,
    height: 400,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      devTools: isDevMode,
      preload: PREFERENCES_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  preferencesWindow.setMenu(null);
  preferencesWindow.loadURL(PREFERENCES_WINDOW_WEBPACK_ENTRY);

  preferencesWindow.webContents.on("did-finish-load", () => {
    setTimeout(() => {
      preferencesWindow?.show();
    }, 40);
  });

  preferencesWindow.on("closed", () => {
    preferencesWindow = null;
  });
};

export const createPluginsWindow = async () => {
  pluginsWindow = new BrowserWindow({
    width: 600,
    height: 700,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      devTools: isDevMode,
      preload: PLUGINS_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });
  pluginsWindow.setMenu(null);
  pluginsWindow.loadURL(PLUGINS_WINDOW_WEBPACK_ENTRY);

  pluginsWindow.webContents.on("did-finish-load", () => {
    setTimeout(() => {
      pluginsWindow?.show();
    }, 40);
  });

  pluginsWindow.on("closed", () => {
    pluginsWindow = null;
  });
};

export const createProjectWindow = async () => {
  const projectWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800,
  });

  // Create the browser window.
  projectWindow = new BrowserWindow({
    x: projectWindowState.x,
    y: projectWindowState.y,
    width: Math.max(640, projectWindowState.width),
    height: Math.max(600, projectWindowState.height),
    minWidth: 640,
    minHeight: 600,
    titleBarStyle: "hiddenInset",
    fullscreenable: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      webSecurity: true,
      devTools: isDevMode,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });
  projectWindowCloseCancelled = false;

  projectWindowState.manage(projectWindow);

  projectWindow.loadURL(
    `${MAIN_WINDOW_WEBPACK_ENTRY}?path=${encodeURIComponent(projectPath)}`,
  );

  projectWindow.setRepresentedFilename(projectPath);

  projectWindow.webContents.on("did-finish-load", () => {
    refreshSpellCheck();
    sendToProjectWindow("open-project", projectPath);
  });

  projectWindow.on("enter-full-screen", () => {
    sendToProjectWindow("app:is-full-screen:changed", true);
  });

  projectWindow.on("leave-full-screen", () => {
    sendToProjectWindow("app:is-full-screen:changed", false);
  });

  projectWindow.on("page-title-updated", (e, title) => {
    documentName = title
      .replace(/^GB Studio -/, "")
      .replace(/\(modified\)$/, "")
      .trim();
  });

  projectWindow.on("close", (e) => {
    if (documentEdited && projectWindow) {
      projectWindowCloseCancelled = false;
      const choice = dialog.showMessageBoxSync(projectWindow, {
        type: "question",
        buttons: [
          l10n("DIALOG_SAVE"),
          l10n("DIALOG_CANCEL"),
          l10n("DIALOG_DONT_SAVE"),
        ],
        defaultId: 0,
        cancelId: 1,
        message: l10n("DIALOG_SAVE_CHANGES", { name: documentName }),
        detail: l10n("DIALOG_SAVE_WARNING"),
      });
      if (choice === 0) {
        // Save
        e.preventDefault();
        sendToProjectWindow("menu:save-project-and-close");
        return;
      } else if (choice === 1) {
        // Cancel
        e.preventDefault();
        keepOpen = false;
        projectWindowCloseCancelled = true;
        return;
      } else {
        // Don't Save
      }
    }

    if (stopWatchingFn) {
      stopWatchingFn();
    }
  });

  projectWindow.on("closed", () => {
    projectWindow = null;
    projectPath = "";
    refreshMenu();
    if (musicWindow) {
      musicWindow.destroy();
    }
  });

  if (stopWatchingFn) {
    stopWatchingFn();
  }

  const projectRoot = Path.dirname(projectPath);

  stopWatchingFn = watchProject(projectPath, {
    onChangedSprite: async (filename: string) => {
      const data = await loadSpriteData(projectRoot)(filename);
      if (!data) {
        console.error(`Unable to load asset ${filename}`);
        return;
      }
      sendToProjectWindow("watch:sprite:changed", filename, data);
    },
    onChangedBackground: async (filename: string) => {
      const data = await loadBackgroundData(projectRoot)(filename);
      if (!data) {
        console.error(`Unable to load asset ${filename}`);
        return;
      }
      sendToProjectWindow("watch:background:changed", filename, data);
    },
    onChangedUI: (filename: string) => {
      sendToProjectWindow("watch:ui:changed", { filename });
    },
    onChangedMusic: async (filename: string) => {
      const data = await loadMusicData(projectRoot)(filename);
      if (!data) {
        console.error(`Unable to load asset ${filename}`);
        return;
      }
      sendToProjectWindow("watch:music:changed", filename, data);
    },
    onChangedSound: async (filename: string) => {
      const data = await loadSoundData(projectRoot)(filename);
      if (!data) {
        console.error(`Unable to load asset ${filename}`);
        return;
      }
      sendToProjectWindow("watch:sound:changed", filename, data);
    },
    onChangedFont: async (filename: string) => {
      const data = await loadFontData(projectRoot)(filename);
      if (!data) {
        console.error(`Unable to load asset ${filename}`);
        return;
      }
      sendToProjectWindow("watch:font:changed", filename, data);
    },
    onChangedAvatar: async (filename: string) => {
      const data = await loadAvatarData(projectRoot)(filename);
      if (!data) {
        console.error(`Unable to load asset ${filename}`);
        return;
      }
      sendToProjectWindow("watch:avatar:changed", filename, data);
    },
    onChangedEmote: async (filename: string) => {
      const data = await loadEmoteData(projectRoot)(filename);
      if (!data) {
        console.error(`Unable to load asset ${filename}`);
        return;
      }
      sendToProjectWindow("watch:emote:changed", filename, data);
    },
    onChangedTileset: async (filename: string) => {
      const data = await loadTilesetData(projectRoot)(filename);
      if (!data) {
        console.error(`Unable to load asset ${filename}`);
        return;
      }
      sendToProjectWindow("watch:tileset:changed", filename, data);
    },
    onRemoveSprite: async (filename: string) => {
      const { file, plugin } = parseAssetPath(filename, projectRoot, "sprites");
      sendToProjectWindow("watch:sprite:removed", file, plugin);
    },
    onRemoveBackground: async (filename: string) => {
      const { file, plugin } = parseAssetPath(
        filename,
        projectRoot,
        "backgrounds",
      );
      sendToProjectWindow("watch:background:removed", file, plugin);
    },
    onRemoveUI: async (filename: string) => {
      sendToProjectWindow("watch:ui:removed", filename);
    },
    onRemoveMusic: async (filename: string) => {
      const { file, plugin } = parseAssetPath(filename, projectRoot, "music");
      sendToProjectWindow("watch:music:removed", file, plugin);
    },
    onRemoveSound: async (filename: string) => {
      const { file, plugin } = parseAssetPath(filename, projectRoot, "sounds");
      sendToProjectWindow("watch:sound:removed", file, plugin);
    },
    onRemoveFont: async (filename: string) => {
      const { file, plugin } = parseAssetPath(filename, projectRoot, "fonts");
      sendToProjectWindow("watch:font:removed", file, plugin);
    },
    onRemoveAvatar: async (filename: string) => {
      const { file, plugin } = parseAssetPath(filename, projectRoot, "avatars");
      sendToProjectWindow("watch:avatar:removed", file, plugin);
    },
    onRemoveEmote: async (filename: string) => {
      const { file, plugin } = parseAssetPath(filename, projectRoot, "emotes");
      sendToProjectWindow("watch:emote:removed", file, plugin);
    },
    onRemoveTileset: async (filename: string) => {
      const { file, plugin } = parseAssetPath(
        filename,
        projectRoot,
        "tilesets",
      );
      sendToProjectWindow("watch:tileset:removed", file, plugin);
    },
    onChangedEngineSchema: async (_filename: string) => {
      const engineSchema = await loadEngineSchema(projectRoot);
      sendToProjectWindow("watch:engineSchema:changed", engineSchema);
    },
    onChangedEventPlugin: async (_filename: string) => {
      // Reload all script event handlers and push new defs to project window
      const projectRoot = Path.dirname(projectPath);
      scriptEventHandlers = await loadAllScriptEventHandlers(projectRoot);
      sendToProjectWindow(
        "watch:scriptEventDefs:changed",
        cloneDictionary(scriptEventHandlers),
      );
    },
  });
};

const sendToProjectWindow = (channel: string, ...args: unknown[]) => {
  projectWindow?.webContents.send(channel, ...args);
};

const sendToSplashWindow = (channel: string, ...args: unknown[]) => {
  splashWindow?.webContents.send(channel, ...args);
};

const sendToMusicWindow = (channel: string, ...args: unknown[]) => {
  musicWindow?.webContents.send(channel, ...args);
};

const sendToGameWindow = (channel: string, ...args: unknown[]) => {
  playWindow?.webContents.send(channel, ...args);
};

const buildLog = (msg: string) => sendToProjectWindow("build:log", msg);
const buildErr = (msg: string) => sendToProjectWindow("build:error", msg);

const waitUntilWindowClosed = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const check = () => {
      if (projectWindow === null) {
        resolve();
      } else if (projectWindowCloseCancelled) {
        reject();
      } else {
        setTimeout(check, 10);
      }
    };
    check();
  });
};

const waitUntilSplashClosed = (): Promise<void> => {
  return new Promise((resolve) => {
    const check = () => {
      if (splashWindow === null) {
        resolve();
      } else {
        setTimeout(check, 10);
      }
    };
    check();
  });
};

const openHelp = async (helpPage: string) => {
  if (helpPage === "sprites") {
    shell.openExternal("https://www.gbstudio.dev/docs/sprites/");
  } else if (helpPage === "backgrounds") {
    shell.openExternal("https://www.gbstudio.dev/docs/backgrounds/");
  } else if (helpPage === "ui-elements") {
    shell.openExternal("https://www.gbstudio.dev/docs/ui-elements/");
  } else if (helpPage === "music") {
    shell.openExternal("https://www.gbstudio.dev/docs/music/");
  } else if (helpPage === "error") {
    shell.openExternal("https://www.gbstudio.dev/docs/error/");
  }
};

export const createPlay = async (
  url: string,
  sgb: boolean,
  debugEnabled?: boolean,
) => {
  if (playWindow && sgb !== playWindowSgb) {
    playWindow.close();
    playWindow = null;
  }

  if (!playWindow) {
    // Create the browser window.
    playWindow = new BrowserWindow({
      width: sgb ? 512 : 480,
      height: sgb ? 448 : 432,
      fullscreenable: false,
      autoHideMenuBar: true,
      useContentSize: true,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: true,
        preload: GAME_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
    });
    playWindow.setAlwaysOnTop(true);
    const isMuted = settings.get(EMULATOR_MUTED_SETTING_KEY) === true;
    if (isMuted) {
      playWindow.webContents.setAudioMuted(true);
    }
    playWindowSgb = sgb;
  } else {
    playWindow.show();
  }

  playWindow.setMenu(null);
  playWindow.loadURL(
    `${url}?audio=true&sgb=${sgb ? "true" : "false"}&debug=${
      !!debugEnabled && !!debuggerInitData ? "true" : "false"
    }`,
  );

  let firstLoad = true;
  playWindow.webContents.on("did-finish-load", () => {
    if (firstLoad) {
      playWindowTitle = playWindow?.getTitle() ?? "";
      firstLoad = false;
    }
    const isMuted = settings.get(EMULATOR_MUTED_SETTING_KEY) === true;
    playWindow?.setTitle(playWindowTitle + (isMuted ? ` 🔇` : ""));
  });

  playWindow.on("closed", () => {
    playWindow = null;
    sendToProjectWindow("debugger:disconnected");
  });
};

export const createMusic = async (
  sfx?: string,
  initialMessage?: MusicDataPacket,
) => {
  musicWindowInitialized = false;

  if (!musicWindow) {
    // Create the browser window.
    musicWindow = new BrowserWindow({
      show: false,
      width: 330,
      height: 330,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        nodeIntegrationInWorker: false,
        webSecurity: true,
        devTools: isDevMode,
        preload: MUSIC_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
    });
  }

  musicWindow.setMenu(null);
  musicWindow.loadURL(MUSIC_WINDOW_WEBPACK_ENTRY);

  musicWindow.on("closed", () => {
    musicWindow = null;
    musicWindowInitialized = false;
  });

  // Handle sending initial message (if given) once window is initialized
  if (initialMessage) {
    const listener = async (_event: unknown, d: MusicDataPacket) => {
      if (musicWindow && d.action === "initialized") {
        sendToMusicWindow("music:data", initialMessage);
        ipcMain.off("music:data-receive", listener);
      }
    };
    ipcMain.on("music:data-receive", listener);
  }
};

protocol.registerSchemesAsPrivileged([
  {
    scheme: "gbs",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
    },
  },
  {
    scheme: "gbshttp",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
    },
  },
]);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  initElectronL10N();

  await themeManager.loadPluginThemes();
  await l10nManager.loadPlugins();
  await templateManager.loadPlugins();

  refreshMenu();

  // Enable DevTools.
  if (isDevMode) {
    // enableLiveReload({ strategy: "react-hmr" });
    // await installExtension(REACT_DEVELOPER_TOOLS);
    // await installExtension(REDUX_DEVTOOLS);
  }

  const lastArg = process.argv[process.argv.length - 1];

  if (require("electron-squirrel-startup")) {
    app.quit();
  } else if (
    process.argv.length >= 2 &&
    lastArg !== "." &&
    lastArg.indexOf("-") !== 0
  ) {
    openProject(lastArg);
  } else if (splashWindow === null && projectWindow === null) {
    createSplash();
  }

  protocol.registerHttpProtocol("gbshttp", async (req, callback) => {
    const { host, pathname } = new URL(req.url);
    if (host === "plugin-repo-asset") {
      const [_, repoId, ...pathParts] = pathname.split("/");
      const repoUrl = getRepoUrlById(repoId);
      if (repoUrl) {
        const repoRoot = Path.dirname(repoUrl);
        const repoPath = pathParts.join("/");
        return callback({
          url: Path.join(repoRoot, repoPath),
        });
      }
    }
    return callback({
      error: 500,
    });
  });

  protocol.registerFileProtocol("gbs", async (req, callback) => {
    const { host, pathname } = new URL(req.url);
    if (host === "project") {
      // Load an asset from the current project
      const projectRoot = Path.dirname(projectPath);
      const filename = Path.join(projectRoot, decodeURI(pathname));
      // Check project has permission to access this asset
      guardAssetWithinProject(filename, projectRoot);
      return callback({ path: filename });
    } else if (host === "app-assets") {
      // Load an asset from the GB Studio global assets folder
      const filename = Path.join(assetsRoot, decodeURI(pathname));
      // Check project has permission to access this asset
      guardAssetWithinProject(filename, assetsRoot);
      return callback({ path: filename });
    } else if (host === "global-plugin") {
      // Load an asset from the GB Studio global plugins folder
      const globalPluginsPath = getGlobalPluginsPath();
      const filename = Path.join(globalPluginsPath, decodeURI(pathname));
      // Check has permission to access this asset
      guardAssetWithinProject(filename, globalPluginsPath);
      return callback({ path: filename });
    }
    return callback({
      error: 500,
    });
  });
});

app.on("open-file", async (_e, projectPath) => {
  await app.whenReady();
  openProject(projectPath);
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    if (!keepOpen) {
      app.quit();
    }
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (splashWindow === null && projectWindow === null) {
    createSplash();
  }
});

ipcMain.handle("app:show-project-window", () => {
  projectWindow?.show();
});

ipcMain.handle("project:open", async (_event, arg) => {
  try {
    const { projectPath } = arg;
    return await openProject(projectPath);
  } catch (e) {
    dialog.showErrorBox(l10n("ERROR_TITLE"), String(e));
  }
});

ipcMain.handle("project:open-project-picker", async (_event, _arg) => {
  openProjectPicker();
});

ipcMain.handle(
  "get-recent-projects",
  async (): Promise<RecentProjectData[]> => {
    const recentProjects = settings.get("recentProjects");
    if (!isStringArray(recentProjects)) return [];
    return recentProjects.map((path) => {
      return {
        name: Path.basename(path),
        dir: Path.dirname(path),
        path,
      };
    });
  },
);

const removeRecentProject = (removePath: string) => {
  const recentProjects = settings.get("recentProjects");
  const newRecents = isStringArray(recentProjects)
    ? recentProjects.filter((path) => path !== removePath)
    : [];
  settings.set("recentProjects", newRecents);
  // Rebuild OS level recent projects
  app.clearRecentDocuments();
  newRecents
    .slice(0)
    .reverse()
    .forEach((path) => {
      app.addRecentDocument(path);
    });
};

ipcMain.handle("clear-recent-projects", async (_event) => {
  settings.set("recentProjects", []);
  app.clearRecentDocuments();
});

ipcMain.handle("remove-recent-project", async (_event, removePath: string) => {
  removeRecentProject(removePath);
});

ipcMain.handle("open-help", async (_event, helpPage) => {
  if (!isString(helpPage)) throw new Error("Invalid URL");
  openHelp(helpPage);
});

ipcMain.handle("open-folder", async (_event, assetPath) => {
  if (!isString(assetPath)) throw new Error("Invalid Path");

  const projectRoot = Path.dirname(projectPath);
  const folderPath = Path.join(projectRoot, assetPath);

  guardAssetWithinProject(folderPath, projectRoot);

  shell.openPath(folderPath);
});

ipcMain.handle("open-image", async (_event, assetPath) => {
  if (!isString(assetPath)) throw new Error("Invalid Path");

  const projectRoot = Path.dirname(projectPath);
  const filename = Path.join(projectRoot, assetPath);

  // Check project has permission to access this asset
  guardAssetWithinProject(filename, projectRoot);

  const app = String(settings.get("imageEditorPath") || "") || undefined;
  open(filename, { app });
});

ipcMain.handle("open-mod", async (_event, assetPath) => {
  if (!isString(assetPath)) throw new Error("Invalid Path");

  const projectRoot = Path.dirname(projectPath);
  const filename = Path.join(projectRoot, assetPath);

  // Check project has permission to access this asset
  guardAssetWithinProject(filename, projectRoot);

  const app = String(settings.get("musicEditorPath") || "") || undefined;
  open(filename, { app });
});

ipcMain.handle("open-file", async (_event, assetPath) => {
  if (!isString(assetPath)) throw new Error("Invalid Path");

  const projectRoot = Path.dirname(projectPath);
  const filename = Path.join(projectRoot, assetPath);

  // Check project has permission to access this asset
  guardAssetWithinProject(filename, projectRoot);

  shell.openPath(filename);
});

ipcMain.handle("open-external", async (_event, url) => {
  if (!isString(url)) throw new Error("Invalid URL");
  const allowedExternalDomains = [
    "https://www.gbstudio.dev",
    "https://www.itch.io",
    "https://github.com",
  ];
  const match = allowedExternalDomains.some((domain) => url.startsWith(domain));
  if (!match) {
    const cancel = confirmOpenURL(url);
    if (cancel) {
      return;
    }
  }
  shell.openExternal(url);
});

ipcMain.handle("open-directory-picker", async () => {
  const selection = await dialog.showOpenDialogSync({
    properties: ["openDirectory"],
  });
  if (selection && selection[0]) {
    return Path.normalize(`${selection[0]}/`);
  }
  return undefined;
});

ipcMain.handle("open-file-picker", async () => {
  const selection = await dialog.showOpenDialog({
    properties: ["openFile"],
  });
  if (selection && selection.filePaths[0]) {
    return Path.normalize(selection.filePaths[0]);
  }
  return undefined;
});

ipcMain.handle(
  "dialog:show-error",
  (_event, title: string, content: string) => {
    dialog.showErrorBox(title, content);
  },
);

ipcMain.handle("dialog:confirm-color", async () => {
  if (!projectWindow) {
    return 1;
  }
  return confirmEnableColorDialog(projectWindow);
});

ipcMain.handle(
  "dialog:confirm-delete-custom-event",
  async (_event, name: string, sceneNames: string[], count: number) => {
    return confirmDeleteCustomEvent(name, sceneNames, count);
  },
);

ipcMain.handle(
  "dialog:confirm-replace-custom-event",
  async (_event, name: string) => {
    return confirmReplaceCustomEvent(name);
  },
);

ipcMain.handle(
  "dialog:confirm-delete-prefab",
  async (_event, name: string, count: number) => {
    return confirmDeletePrefab(name, count);
  },
);

ipcMain.handle(
  "dialog:confirm-replace-prefab",
  async (_event, name: string) => {
    return confirmReplacePrefab(name);
  },
);

ipcMain.handle("dialog:confirm-unpack-prefab", async (_event) => {
  return confirmUnpackPrefab();
});

ipcMain.handle("dialog:confirm-delete-preset", async (_event, name: string) => {
  return confirmDeletePreset(name);
});

ipcMain.handle("dialog:confirm-apply-preset", async () => {
  return confirmApplyPreset();
});

ipcMain.handle(
  "dialog:confirm-delete-constant",
  async (_event, name: string, usesNames: string[]) => {
    return confirmDeleteConstant(name, usesNames);
  },
);

ipcMain.handle(
  "dialog:confirm-tracker-unsaved",
  async (_event, name: string) => {
    return confirmUnsavedChangesTrackerDialog(name);
  },
);

ipcMain.handle("dialog:migrate-warning", async (_event, path: string) => {
  try {
    return await migrateWarning(path);
  } catch (e) {
    if (e instanceof Error) {
      dialog.showErrorBox(l10n("ERROR_INVALID_FILE_TYPE"), e.stack ?? "");
    } else {
      dialog.showErrorBox(l10n("ERROR_INVALID_FILE_TYPE"), String(e));
    }
    return false;
  }
});

ipcMain.handle("close-project", () => {
  projectWindow?.close();
});

ipcMain.handle("project:set-modified", () => {
  projectWindow?.setDocumentEdited(true);
  documentEdited = true; // For Windows
});

ipcMain.handle("project:set-unmodified", () => {
  projectWindow?.setDocumentEdited(false);
  documentEdited = false; // For Windows
});

ipcMain.handle(
  "project:rename-asset",
  async (
    _event,
    assetType: AssetType,
    asset: Asset,
    filename: string,
  ): Promise<boolean> => {
    if (!filename || filename.length === 0) {
      return false;
    }
    const projectRoot = Path.dirname(projectPath);
    const originalFilename = assetFilename(projectRoot, assetType, asset);
    const newFilename = assetFilename(projectRoot, assetType, {
      ...asset,
      filename,
    });

    // Check project has permission to access this asset
    guardAssetWithinProject(originalFilename, projectRoot);
    guardAssetWithinProject(newFilename, projectRoot);

    if (await fileExists(newFilename)) {
      return false;
    }

    await move(originalFilename, newFilename);

    const renameEventLookup: Record<AssetType, string> = {
      backgrounds: "watch:background:renamed",
      avatars: "watch:avatar:renamed",
      emotes: "watch:emote:renamed",
      tilesets: "watch:tileset:renamed",
      fonts: "watch:font:renamed",
      music: "watch:music:renamed",
      sounds: "watch:sound:renamed",
      sprites: "watch:sprite:renamed",
      ui: "watch:ui:renamed",
    };

    // Send watch event explicitly rather than waiting for Chokidar
    // as Chokidar will sometimes only emit the unlink event when renaming from Node
    sendToProjectWindow(
      renameEventLookup[assetType],
      asset.filename,
      filename,
      asset.plugin,
    );

    return true;
  },
);

ipcMain.handle(
  "project:remove-asset",
  async (_event, assetType: AssetType, asset: Asset): Promise<boolean> => {
    const projectRoot = Path.dirname(projectPath);
    const filename = assetFilename(projectRoot, assetType, asset);

    // Check project has permission to access this asset
    guardAssetWithinProject(filename, projectRoot);

    if (!(await fileExists(filename))) {
      return false;
    }

    if (!confirmDeleteAsset(assetType, asset)) {
      return false;
    }

    try {
      await remove(filename);
    } catch (e) {
      return false;
    }

    const renameEventLookup: Record<AssetType, string> = {
      backgrounds: "watch:background:removed",
      avatars: "watch:avatar:removed",
      emotes: "watch:emote:removed",
      tilesets: "watch:tileset:removed",
      fonts: "watch:font:removed",
      music: "watch:music:removed",
      sounds: "watch:sound:removed",
      sprites: "watch:sprite:removed",
      ui: "watch:ui:removed",
    };

    sendToProjectWindow(
      renameEventLookup[assetType],
      asset.filename,
      asset.plugin,
    );

    return true;
  },
);

ipcMain.handle("get-documents-path", async (_event) => {
  return app.getPath("documents");
});

ipcMain.handle("get-tmp-path", async () => {
  return getTmp();
});

ipcMain.handle("create-project", async (_event, input: CreateProjectInput) =>
  createProject(input),
);

ipcMain.handle("build:delete-cache", async (_event) => {
  const cacheRoot = Path.normalize(`${getTmp()}/_gbscache`);
  await remove(cacheRoot);
});

ipcMain.handle("project:update-project-window-menu", (_event, settings) => {
  const { showCollisions, showConnections, showNavigator } = settings;
  setMenuItemChecked("showCollisions", showCollisions);
  setMenuItemChecked("showConnectionsAll", showConnections === "all");
  setMenuItemChecked(
    "showConnectionsSelected",
    showConnections === "selected" || showConnections === true,
  );
  setMenuItemChecked("showConnectionsNone", showConnections === false);
  setMenuItemChecked("showNavigator", showNavigator);
});

ipcMain.handle("set-ui-scale", (_, scale: number) => {
  settings.set("zoomLevel", scale);
  sendToProjectWindow("setting:ui-scale:changed", scale);
});

ipcMain.handle("set-tracker-keybindings", (_, value: number) => {
  settings.set("trackerKeyBindings", value);
  sendToProjectWindow("keybindings-update", value);
});

ipcMain.handle("music:open", async (_event, sfx?: string) => {
  createMusic(sfx);
});

ipcMain.handle("music:close", async () => {
  if (musicWindow) {
    musicWindow.destroy();
    musicWindowInitialized = false;
  }
});

ipcMain.on("music:data-send", (_event, data: MusicDataPacket) => {
  if (musicWindow && musicWindowInitialized) {
    sendToMusicWindow("music:data", data);
  }
});

ipcMain.on("music:data-receive", (_event, data: MusicDataReceivePacket) => {
  if (data.action === "initialized") {
    musicWindowInitialized = true;
  }
  if (projectWindow) {
    sendToProjectWindow("music:data", data);
  }
});

ipcMain.on("debugger:data-receive", (_event, data: DebuggerDataPacket) => {
  if (data.action === "initialized" && debuggerInitData) {
    sendToGameWindow("debugger:data", {
      action: "listener-ready",
      data: debuggerInitData,
    });
  }
  if (projectWindow) {
    sendToProjectWindow("debugger:data", data);
  }
});

ipcMain.handle("debugger:resume", (_event) => {
  sendToGameWindow("debugger:data", {
    action: "resume",
  });
});

ipcMain.handle("debugger:pause", (_event) => {
  sendToGameWindow("debugger:data", {
    action: "pause",
  });
});

ipcMain.handle("debugger:step", (_event) => {
  sendToGameWindow("debugger:data", {
    action: "step",
  });
});

ipcMain.handle("debugger:step-frame", (_event) => {
  sendToGameWindow("debugger:data", {
    action: "step-frame",
  });
});

ipcMain.handle("debugger:pause-on-script", (_event, enabled: boolean) => {
  sendToGameWindow("debugger:data", {
    action: "pause-on-script",
    data: enabled,
  });
});

ipcMain.handle("debugger:pause-on-var", (_event, enabled: boolean) => {
  sendToGameWindow("debugger:data", {
    action: "pause-on-var",
    data: enabled,
  });
});

ipcMain.handle(
  "debugger:set-global",
  (_event, symbol: string, value: number) => {
    sendToGameWindow("debugger:data", {
      action: "set-global",
      data: { symbol, value },
    });
  },
);

ipcMain.handle("debugger:set-breakpoints", (_event, breakpoints: string[]) => {
  sendToGameWindow("debugger:data", {
    action: "set-breakpoints",
    data: breakpoints,
  });
});

ipcMain.handle("debugger:set-watched", (_event, variableIds: string[]) => {
  sendToGameWindow("debugger:data", {
    action: "set-watched",
    data: variableIds,
  });
});

ipcMain.handle("get-l10n-strings", () => getL10NData());

ipcMain.handle("get-theme", () => {
  const themeId = ensureString(settings.get(THEME_SETTING_KEY), "");
  return themeManager.getTheme(themeId, nativeTheme.shouldUseDarkColors);
});

ipcMain.handle("settings-get", (_, key: string) => settings.get(key));
ipcMain.handle("settings-set", (_, key: string, value: JsonValue) => {
  settings.set(key, value);
});
ipcMain.handle("settings-delete", (_, key: string) => {
  settings.delete(key);
});

ipcMain.handle("app:get-is-full-screen", async () => {
  if (projectWindow) {
    return projectWindow.isFullScreen();
  }
  return false;
});

ipcMain.handle("app:get-patrons", async () => {
  return getPatronsFromGithub();
});

ipcMain.handle("clipboard:read-text", () => {
  return clipboard.readText();
});

ipcMain.handle("clipboard:read-buffer", (_, format: string) => {
  return clipboard.readBuffer(format);
});

ipcMain.handle("clipboard:write-text", (_, value: string) => {
  return clipboard.writeText(value);
});

ipcMain.handle(
  "clipboard:write-buffer",
  (_, format: string, buffer: Buffer) => {
    return clipboard.writeBuffer(format, buffer);
  },
);

ipcMain.handle("project:load", async (): Promise<LoadProjectResult> => {
  return loadProjectData(projectPath);
});

ipcMain.handle(
  "project:save",
  async (_, data: WriteResourcesPatch): Promise<void> => {
    await saveProjectData(projectPath, data, {
      progress: (completed: number, total: number) => {
        sendToProjectWindow("project:save-progress", completed, total);
      },
    });
  },
);

ipcMain.handle(
  "project:get-resource-checksums",
  async (): Promise<Record<string, string>> => {
    return loadProjectResourceChecksums(projectPath);
  },
);

ipcMain.handle(
  "project:build",
  async (event, project: ProjectResources, options: BuildOptions) => {
    const { exportBuild, buildType } = options;
    const buildStartTime = Date.now();
    const projectRoot = Path.dirname(projectPath);
    const outputRoot = Path.normalize(`${getTmp()}/${buildUUID}`);
    const colorMode = project.settings.colorMode;
    const sgbEnabled =
      project.settings.sgbEnabled && project.settings.colorMode !== "color";
    const debuggerEnabled =
      options.debugEnabled || project.settings.debuggerEnabled;
    const colorOnly = project.settings.colorMode === "color";
    const gameFile = colorOnly ? "game.gbc" : "game.gb";
    const progress = (message: string) => {
      if (
        message !== "'" &&
        message.indexOf("unknown or unsupported #pragma") === -1
      ) {
        buildLog(message);
      }
    };
    const warnings = (message: string) => {
      if (message && !message.includes("SIGTERM")) {
        buildErr(message);
      }
    };

    try {
      const compiledData = await buildProject(project, {
        ...options,
        projectRoot,
        outputRoot,
        tmpPath: getTmp(),
        debugEnabled: debuggerEnabled,
        progress,
        warnings,
      });

      if (exportBuild) {
        await copy(
          `${outputRoot}/build/${buildType}`,
          `${projectRoot}/build/${buildType}`,
        );
        shell.openPath(Path.join(projectRoot, "build", buildType));
        buildLog(`-`);
        buildLog(
          `${l10n("COMPILER_BUILD_SUCCESS")} ${
            buildType === "web"
              ? `${l10n("COMPILER_SITE_READY_AT")} ${Path.normalize(
                  `${projectRoot}/build/web/index.html`,
                )}`
              : buildType === "pocket"
                ? `${l10n("COMPILER_ROM_READY_AT")} ${Path.normalize(
                    `${projectRoot}/build/pocket/game.pocket`,
                  )}`
                : `${l10n("COMPILER_ROM_READY_AT")} ${Path.normalize(
                    `${projectRoot}/build/rom/${gameFile}`,
                  )}`
          }`,
        );
      }

      const usageData = await romUsage({
        buildRoot: outputRoot,
        tmpPath: getTmp(),
        progress,
        warnings,
      });

      sendToProjectWindow("debugger:romusage", usageData);

      if (buildType === "web" && !exportBuild) {
        buildLog(`-`);
        buildLog(
          `${l10n("COMPILER_BUILD_SUCCESS")} ${l10n(
            "COMPILER_STARTING_EMULATOR",
          )}...`,
        );
        if (debuggerEnabled) {
          const { memoryMap, globalVariables } =
            await readDebuggerSymbols(outputRoot);
          debuggerInitData = {
            memoryMap,
            globalVariables,
            pauseOnScriptChanged: project.settings.debuggerPauseOnScriptChanged,
            pauseOnWatchedVariableChanged:
              project.settings.debuggerPauseOnWatchedVariableChanged,
            breakpoints: project.settings.debuggerBreakpoints.map(
              (breakpoint) => breakpoint.scriptEventId,
            ),
            watchedVariables: project.settings.debuggerWatchedVariables,
            variableMap: keyBy(Object.values(compiledData.variableMap), "id"),
          };
          const gbvmScripts = pickBy(compiledData.files, (_, key) =>
            key.endsWith(".s"),
          );
          sendToProjectWindow("debugger:symbols", {
            variableMap: compiledData.variableMap,
            sceneMap: compiledData.sceneMap,
            gbvmScripts,
          });
        }
        createPlay(
          `file://${outputRoot}/build/web/index.html`,
          sgbEnabled && colorMode === "mono",
          debuggerEnabled,
        );
      }

      const buildTime = Date.now() - buildStartTime;
      buildLog(`${l10n("COMPILER_BUILD_TIME")}: ${msToHumanTime(buildTime)}`);
    } catch (e) {
      if (typeof e === "string") {
        buildErr(e);
      } else if (
        e === null ||
        typeof e === "number" ||
        (e instanceof Error && e.message === "BUILD_CANCELLED")
      ) {
        buildLog(l10n("BUILD_CANCELLED"));
      } else if (e instanceof Error) {
        buildErr(e.toString());
      }
      throw e;
    }
  },
);

ipcMain.handle("project:build-cancel", () => {
  cancelCompileStepsInProgress();
});

ipcMain.handle("project:engine-eject", () => {
  const cancel = confirmEjectEngineDialog();

  if (cancel) {
    return;
  }

  const projectRoot = Path.dirname(projectPath);
  const outputDir = Path.join(projectRoot, "assets", "engine");

  let ejectedEngineExists;
  try {
    statSync(outputDir);
    ejectedEngineExists = true;
  } catch (e) {
    ejectedEngineExists = false;
  }

  if (ejectedEngineExists) {
    const cancel2 = confirmEjectEngineReplaceDialog();
    if (cancel2) {
      return;
    }
  }

  ejectEngineToDir(outputDir).then(() => {
    shell.openPath(outputDir);
  });
});

ipcMain.handle(
  "project:export",
  async (
    event,
    project: ProjectResources,
    engineSchema: EngineSchema,
    exportType: ProjectExportType,
  ) => {
    const buildStartTime = Date.now();

    try {
      const projectRoot = Path.dirname(projectPath);
      const outputRoot = Path.normalize(`${getTmp()}/${buildUUID}`);

      const progress = (message: string) => {
        if (
          message !== "'" &&
          message.indexOf("unknown or unsupported #pragma") === -1
        ) {
          buildLog(message);
        }
      };
      const warnings = (message: string) => {
        buildErr(message);
      };

      await buildProject(project, {
        projectRoot,
        outputRoot,
        tmpPath: getTmp(),
        buildType: "rom",
        engineSchema,
        debugEnabled: false,
        make: false,
        progress,
        warnings,
      });

      const exportRoot = Path.join(projectRoot, "build", "src");

      if (exportType === "data") {
        const dataSrcTmpPath = Path.join(outputRoot, "src", "data");
        const dataSrcOutPath = Path.join(exportRoot, "src", "data");
        const dataIncludeTmpPath = Path.join(outputRoot, "include", "data");
        const dataIncludeOutPath = Path.join(exportRoot, "include", "data");
        await remove(dataSrcOutPath);
        await remove(dataIncludeOutPath);
        await copy(dataSrcTmpPath, dataSrcOutPath);
        await copy(dataIncludeTmpPath, dataIncludeOutPath);
      } else {
        await copy(outputRoot, exportRoot);
      }

      const buildTime = Date.now() - buildStartTime;
      buildLog(`${l10n("COMPILER_BUILD_TIME")}: ${msToHumanTime(buildTime)}`);

      shell.openPath(exportRoot);
    } catch (e) {
      if (typeof e === "string") {
        buildErr(e);
      } else if (e instanceof Error) {
        buildErr(e.toString());
      }
      throw e;
    }
  },
);

ipcMain.handle(
  "project:get-background-info",
  (
    _event,
    background: Background,
    tileset: Tileset | undefined,
    is360: boolean,
    cgbOnly: boolean,
  ) => {
    const projectRoot = Path.dirname(projectPath);
    return getBackgroundInfo(background, tileset, is360, cgbOnly, projectRoot);
  },
);

ipcMain.handle(
  "project:add-file",
  async (_event, filename: string): Promise<void> => {
    const projectRoot = Path.dirname(projectPath);
    const folders = await potentialAssetFolders(filename);

    if (folders.length > 0) {
      let copyFolder: AssetFolder | undefined = folders[0];

      if (folders.length > 1) {
        copyFolder = await confirmAssetFolder(folders);
      }

      if (copyFolder) {
        const destPath = `${projectRoot}/assets/${copyFolder}/${Path.basename(
          filename,
        )}`;

        const isInProject = Path.relative(filename, destPath) === "";

        if (!isInProject) {
          await copyFile(filename, destPath);
        }
      }
    }
  },
);

ipcMain.handle(
  "tracker:new",
  async (_event, assetPath: string): Promise<MusicResourceAsset> => {
    const projectRoot = Path.dirname(projectPath);
    const filename = Path.join(projectRoot, assetPath);

    // Check project has permission to access this asset
    guardAssetWithinProject(filename, projectRoot);

    const templatePath = `${projectTemplatesRoot}/gbhtml/assets/music/template.uge`;
    const copy2 = async (
      oPath: string,
      path: string,
    ): Promise<MusicResourceAsset> => {
      try {
        const exists = await pathExists(path);
        if (!exists) {
          await copy(oPath, path, {
            overwrite: false,
            errorOnExist: true,
          });
          const data = await loadMusicData(projectRoot)(path);
          if (!data) {
            console.error(`Unable to load asset ${filename}`);
          }
          return data;
        } else {
          const [filename] = path.split(".uge");
          const matches = filename.match(/\d+$/);
          let newFilename = `${filename} 1`;
          if (matches) {
            // if filename ends with number
            const number = parseInt(matches[0]) + 1;
            newFilename = filename.replace(/\d+$/, `${number}`);
          }
          const newPath = `${newFilename}.uge`;
          return await copy2(oPath, newPath);
        }
      } catch (e) {
        console.error(e);
        throw e;
      }
    };
    return await copy2(templatePath, filename);
  },
);

ipcMain.handle("tracker:load", async (_event, assetPath: string) => {
  const projectRoot = Path.dirname(projectPath);
  const filename = Path.join(projectRoot, assetPath);
  // Check project has permission to access this asset
  guardAssetWithinProject(filename, projectRoot);
  // Convert song to UGE format and save
  const data = await readFile(filename);
  const song = loadUGESong(new Uint8Array(data).buffer);
  if (song) {
    song.filename = assetPath;
  }
  return song;
});

ipcMain.handle("tracker:save", async (_event, song: Song) => {
  const projectRoot = Path.dirname(projectPath);
  const filename = Path.join(projectRoot, song.filename);
  // Check project has permission to access this asset
  guardAssetWithinProject(filename, projectRoot);
  // Convert song to UGE format and save
  const buffer = saveUGESong(song);
  await writeFileWithBackupAsync(filename, new Uint8Array(buffer), "utf8");
});

ipcMain.handle("sfx:play-wav", async (_event, assetPath: string) => {
  const projectRoot = Path.dirname(projectPath);
  const filename = Path.join(projectRoot, assetPath);

  // Check project has permission to access this asset
  guardAssetWithinProject(filename, projectRoot);
  const sfx = await compileWav(filename, "asm");
  createMusic(sfx, {
    action: "load-sound",
    sound: sfx,
  });
});

ipcMain.handle("sfx:play-vgm", async (_event, assetPath: string) => {
  const projectRoot = Path.dirname(projectPath);
  const filename = Path.join(projectRoot, assetPath);

  // Check project has permission to access this asset
  guardAssetWithinProject(filename, projectRoot);
  const { output: sfx } = await compileVGM(filename, "asm");
  createMusic(sfx, {
    action: "load-sound",
    sound: sfx,
  });
});

ipcMain.handle(
  "sfx:play-fxhammer",
  async (_event, assetPath: string, effectIndex: number) => {
    const projectRoot = Path.dirname(projectPath);
    const filename = Path.join(projectRoot, assetPath);

    // Check project has permission to access this asset
    guardAssetWithinProject(filename, projectRoot);

    try {
      const { output: sfx } = await compileFXHammerSingle(
        filename,
        effectIndex,
        "asm",
      );
      createMusic(sfx, {
        action: "load-sound",
        sound: sfx,
      });
    } catch (e) {
      console.error("Unable to play FX Hammer SFX", filename, effectIndex);
    }
  },
);

ipcMain.handle("music:play-uge", async (_event, assetPath: string) => {
  const projectRoot = Path.dirname(projectPath);
  const filename = Path.join(projectRoot, assetPath);

  // Check project has permission to access this asset
  guardAssetWithinProject(filename, projectRoot);
  const fileData = toArrayBuffer(await readFile(filename));
  const data = loadUGESong(fileData);
  if (!data) {
    console.error(`No data in song "${filename}"`);
    return;
  }
  createMusic(undefined, {
    action: "play",
    song: data,
    position: [0, 0],
  });
});

ipcMain.handle(
  "sprite:compile",
  async (
    _event,
    spriteData: SpriteSheetData,
    defaultSpriteMode: SpriteModeSetting
  ): Promise<PrecompiledSpriteSheetData> => {
    const projectRoot = Path.dirname(projectPath);
    const filename = assetFilename(projectRoot, "sprites", spriteData);
    // Check project has permission to access this asset
    guardAssetWithinProject(filename, projectRoot);
    return compileSprite(
      { ...spriteData, colorMode: "mixed" },
      false,
      projectRoot,
      defaultSpriteMode
    );
  },
);

ipcMain.handle(
  "script:get-auto-label",
  async (_, command: string, args: Record<string, unknown>) => {
    return getAutoLabel(command, args, scriptEventHandlers);
  },
);

ipcMain.handle(
  "script:post-update-fn",
  async (
    _,
    command: string,
    fieldKey: string,
    args: Record<string, unknown>,
    prevArgs: Record<string, unknown>,
  ) => {
    const event = scriptEventHandlers[command];
    if (!event) {
      return args;
    }
    const field = event.fieldsLookup[fieldKey];
    if (!field || !field.postUpdateFn) {
      return args;
    }
    return {
      ...field.postUpdateFn(args, prevArgs),
    };
  },
);

ipcMain.handle("plugins:fetch-list", (_, force?: boolean) => {
  return getGlobalPluginsList(force);
});

ipcMain.handle("plugins:list-repos", () => {
  return getReposList();
});

ipcMain.handle("plugins:add-repo", async (_, url: string) => {
  await addUserRepo(url);
});

ipcMain.handle("plugins:remove-repo", async (_, url: string) => {
  await removeUserRepo(url);
});

ipcMain.handle("plugins:add", async (_, pluginId: string, repoId: string) => {
  await addPluginToProject(projectPath, pluginId, repoId);
});

ipcMain.handle(
  "plugins:remove",
  async (_, pluginId: string, pluginType: PluginType) => {
    if (isGlobalPluginType(pluginType)) {
      await removeGlobalPlugin(pluginId);
    } else {
      if (!projectPath) {
        dialog.showErrorBox(
          l10n("ERROR_UNABLE_TO_REMOVE_PLUGIN"),
          l10n("ERROR_NO_PROJECT_IS_OPEN"),
        );
        return;
      }
      await removePluginFromProject(projectPath, pluginId);
    }
  },
);

ipcMain.handle("plugins:get-installed", async () => {
  const plugins: InstalledPluginData[] = [];
  if (projectPath) {
    const projectPlugins = await getPluginsInProject(projectPath);
    plugins.push(...projectPlugins);
  }
  const globalPlugins = await getPluginsInstalledGlobally();
  plugins.push(...globalPlugins);
  return plugins;
});

ipcMain.handle("templates:list", async () => {
  return templateManager.getPluginTemplates();
});

menu.on("new", async () => {
  newProject();
});

menu.on("open", async () => {
  openProjectPicker();
});

menu.on("project", async () => {
  switchProject();
});

menu.on("save", async () => {
  sendToProjectWindow("menu:save-project");
});

menu.on("saveAs", async () => {
  saveAsProjectPicker();
});

menu.on("undo", async () => {
  sendToProjectWindow("menu:undo");
});

menu.on("redo", async () => {
  sendToProjectWindow("menu:redo");
});

menu.on("section", async (section) => {
  sendToProjectWindow("menu:section", section);
});

menu.on("reloadAssets", () => {
  sendToProjectWindow("menu:reload-assets");
});

menu.on("zoom", (zoomType) => {
  sendToProjectWindow("menu:zoom", zoomType);
});

menu.on("run", (debugEnabled) => {
  sendToProjectWindow("menu:run", debugEnabled);
});

menu.on("build", (buildType) => {
  sendToProjectWindow("menu:build", buildType);
});

menu.on("ejectEngine", () => {
  sendToProjectWindow("menu:eject-engine");
});

menu.on("exportProjectSrc", () => {
  sendToProjectWindow("menu:export-project", "src");
});

menu.on("exportProjectData", () => {
  sendToProjectWindow("menu:export-project", "data");
});

menu.on("pasteInPlace", () => {
  sendToProjectWindow("menu:paste-in-place");
});

menu.on("checkUpdates", () => {
  checkForUpdate(true);
});

menu.on("openMusic", () => {
  if (musicWindow) {
    musicWindow.show();
    musicWindow.webContents.openDevTools();
  } else {
    dialog.showErrorBox(
      "No music process running",
      "Have you selected a song?",
    );
  }
});

menu.on("preferences", () => {
  if (!preferencesWindow) {
    createPreferences();
  } else {
    preferencesWindow.show();
  }
});

menu.on("pluginManager", () => {
  if (!pluginsWindow) {
    createPluginsWindow();
  } else {
    pluginsWindow.show();
  }
});

menu.on("globalPlugins", async () => {
  const globalPluginsPath = await ensureGlobalPluginsPath();
  shell.openPath(globalPluginsPath);
});

menu.on("projectPlugins", () => {
  if (!projectPath) {
    dialog.showErrorBox(l10n("ERROR_NO_PROJECT_IS_OPEN"), "");
    return;
  }
  const projectRoot = Path.dirname(projectPath);
  const pluginsPath = Path.join(projectRoot, "plugins");
  shell.openPath(pluginsPath);
});

menu.on("updateTheme", (value) => {
  const pluginThemes = themeManager.getPluginThemes();
  settings.set(THEME_SETTING_KEY, value as JsonValue);
  setMenuItemChecked("themeDefault", value === undefined);
  setMenuItemChecked("themeLight", value === "light");
  setMenuItemChecked("themeDark", value === "dark");
  for (const pluginTheme of pluginThemes) {
    setMenuItemChecked(`theme-${pluginTheme.id}`, value === pluginTheme.id);
  }
  refreshTheme();
});

menu.on("updateLocale", (value) => {
  settings.set(LOCALE_SETTING_KEY, value as JsonValue);
  setMenuItemChecked("localeDefault", value === undefined);
  for (const lang of l10nManager.getSystemL10Ns()) {
    setMenuItemChecked(`locale-${lang.id}`, value === lang.id);
  }
  for (const lang of l10nManager.getPluginL10Ns()) {
    setMenuItemChecked(`locale-${lang.id}`, value === lang.id);
  }
  switchLanguageDialog();
  initElectronL10N();
  refreshSpellCheck();
});

menu.on("updateCheckSpelling", (value) => {
  settings.set("checkSpelling", value as JsonValue);
  setMenuItemChecked("checkSpelling", value !== false);
  refreshSpellCheck();
});

menu.on("updateShowCollisions", (value) => {
  settings.set("showCollisions", value as JsonValue);
  sendToProjectWindow("setting:changed", "showCollisions", value);
});

menu.on("updateShowConnections", (value) => {
  settings.set("showConnections", value as JsonValue);
  setMenuItemChecked("showConnectionsAll", value === "all");
  setMenuItemChecked(
    "showConnectionsSelected",
    value === "selected" || value === true,
  );
  setMenuItemChecked("showConnectionsNone", value === false);
  sendToProjectWindow("setting:changed", "showConnections", value);
});

menu.on("updateShowNavigator", (value) => {
  settings.set("showNavigator", value as JsonValue);
  sendToProjectWindow("setting:changed", "showNavigator", value);
});

menu.on("updateEmulatorMuted", (value) => {
  const isMuted = value === true;
  settings.set(EMULATOR_MUTED_SETTING_KEY, isMuted);
  if (playWindow) {
    playWindow.webContents.setAudioMuted(isMuted);
    playWindow?.setTitle(playWindowTitle + (isMuted ? ` 🔇` : ""));
  }
});

nativeTheme?.on("updated", () => {
  refreshTheme();
});

watchGlobalPlugins({
  onChangedThemePlugin: async (path: string) => {
    await themeManager.loadPluginTheme(path);
    refreshMenu();
    refreshTheme();
  },
  onChangedLanguagePlugin: async (path: string) => {
    await l10nManager.loadPlugin(path);
    refreshMenu();
  },
  onChangedTemplatePlugin: async (path: string) => {
    await templateManager.loadPlugin(path);
    refreshTemplatesList();
  },
  onRemoveThemePlugin: async () => {
    await themeManager.loadPluginThemes();
    refreshMenu();
    refreshTheme();
  },
  onRemoveLanguagePlugin: async () => {
    await l10nManager.loadPlugins();
    refreshMenu();
  },
  onRemoveTemplatePlugin: async () => {
    await templateManager.loadPlugins();
    refreshTemplatesList();
  },
});

const refreshTheme = () => {
  const themeId = ensureString(settings.get(THEME_SETTING_KEY), "");
  const theme = themeManager.getTheme(themeId, nativeTheme.shouldUseDarkColors);
  sendToSplashWindow("update-theme", theme);
  sendToProjectWindow("update-theme", theme);
};

const refreshTemplatesList = () => {
  sendToSplashWindow(
    "templates:list:changed",
    templateManager.getPluginTemplates(),
  );
};

const refreshMenu = () => {
  menu.buildMenu({
    themeManager,
    l10nManager,
  });
};

const newProject = async () => {
  keepOpen = true;
  if (splashWindow) {
    splashWindow.close();
    await waitUntilSplashClosed();
  }
  if (projectWindow) {
    projectWindow.close();
    await waitUntilWindowClosed();
  }
  await createSplash("new");
  keepOpen = false;
};

const openProjectPicker = async () => {
  const files = dialog.showOpenDialogSync({
    properties: ["openFile"],
    filters: [
      {
        name: "Projects",
        extensions: ["gbsproj", "json"],
      },
    ],
  });
  if (files && files[0]) {
    keepOpen = true;
    if (projectWindow) {
      projectWindow.close();
      await waitUntilWindowClosed();
    }

    openProject(files[0]);

    keepOpen = false;
  }
};

const switchProject = async () => {
  keepOpen = true;
  if (projectWindow) {
    projectWindow.close();
    await waitUntilWindowClosed();
  }
  if (splashWindow) {
    splashWindow.close();
    await waitUntilSplashClosed();
  }
  await createSplash("recent");
  keepOpen = false;
};

const openProject = async (newProjectPath: string): Promise<boolean> => {
  const ext = Path.extname(newProjectPath);
  if (validProjectExt.indexOf(ext) === -1) {
    dialog.showErrorBox(
      l10n("ERROR_INVALID_FILE_TYPE"),
      l10n("ERROR_OPEN_GBSPROJ_FILE"),
    );
    removeRecentProject(newProjectPath);
    return false;
  }

  try {
    await stat(newProjectPath);
  } catch (e) {
    dialog.showErrorBox(
      l10n("ERROR_MISSING_PROJECT"),
      l10n("ERROR_MOVED_OR_DELETED"),
    );
    removeRecentProject(newProjectPath);
    return false;
  }

  projectPath = newProjectPath;
  addRecentProject(projectPath);

  const projectRoot = Path.dirname(projectPath);
  scriptEventHandlers = await loadAllScriptEventHandlers(projectRoot);

  keepOpen = true;

  if (projectWindow) {
    projectWindow.close();
    await waitUntilWindowClosed();
  }
  await createProjectWindow();
  if (splashWindow) {
    splashWindow.close();
  }

  keepOpen = false;
  return true;
};

const addRecentProject = (projectPath: string) => {
  // Store recent projects
  settings.set(
    "recentProjects",
    ([] as string[])
      .concat((settings.get("recentProjects") || []) as string[], projectPath)
      .reverse()
      .filter(
        (filename: string, index: number, arr: string[]) =>
          arr.indexOf(filename) === index,
      ) // Only unique
      .reverse()
      .slice(-10),
  );
  app.addRecentDocument(projectPath);
};

const refreshSpellCheck = () => {
  const spellCheckEnabled = settings.get("checkSpelling") !== false;
  if (projectWindow) {
    const session = projectWindow.webContents.session;
    const appLocale = getAppLocale();
    const spellCheckLanguages = session.availableSpellCheckerLanguages.filter(
      (lang) => lang === appLocale,
    );
    session.setSpellCheckerEnabled(spellCheckEnabled);
    session.setSpellCheckerLanguages(
      spellCheckLanguages.length > 0 ? spellCheckLanguages : ["en"],
    );
  }
};

const saveAsProjectPicker = async () => {
  const files = dialog.showSaveDialogSync({
    filters: [
      {
        name: "Projects",
        extensions: ["gbsproj", "json"],
      },
    ],
  });
  if (files) {
    saveAsProject(files);
  }
};

const saveAsProject = async (saveAsPath: string) => {
  const originalProjectPath = projectPath;
  const projectName = Path.parse(saveAsPath).name;
  const projectDir = Path.join(Path.dirname(saveAsPath), projectName);
  const newProjectPath = Path.join(projectDir, Path.basename(saveAsPath));
  const newProjectDir = Path.dirname(newProjectPath);

  let projectExists;
  try {
    await stat(newProjectDir);
    projectExists = true;
  } catch (e) {
    projectExists = false;
  }
  if (projectExists) {
    dialog.showErrorBox(
      l10n("ERROR_PROJECT_ALREADY_EXISTS"),
      l10n("ERROR_PLEASE_SELECT_A_DIFFERENT_LOCATION"),
    );
    return;
  }

  const ext = Path.extname(saveAsPath);
  if (validProjectExt.indexOf(ext) === -1) {
    dialog.showErrorBox(
      l10n("ERROR_INVALID_FILE_TYPE"),
      l10n("ERROR_OPEN_GBSPROJ_FILE"),
    );
    return;
  }

  await copy(Path.dirname(originalProjectPath), Path.dirname(newProjectPath));

  projectPath = newProjectPath;
  addRecentProject(projectPath);

  sendToProjectWindow("menu:save-project");
};
