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
} from "fs-extra";
import menu, { setMenuItemChecked } from "./menu";
import { checkForUpdate } from "lib/helpers/updateChecker";
import switchLanguageDialog from "lib/electron/dialog/switchLanguageDialog";
import installExtension, {
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS,
} from "electron-devtools-installer";
import { toThemeId } from "shared/lib/theme";
import { isString, isStringArray, JsonValue } from "shared/types";
import getTmp from "lib/helpers/getTmp";
import createProject, { CreateProjectInput } from "lib/project/createProject";
import open from "open";
import confirmEnableColorDialog from "lib/electron/dialog/confirmEnableColorDialog";
import confirmDeleteCustomEvent from "lib/electron/dialog/confirmDeleteCustomEvent";
import type { ProjectData } from "store/features/project/projectActions";
import type { BuildOptions } from "renderer/lib/api/setup";
import buildProject from "lib/compiler/buildProject";
import copy from "lib/helpers/fsCopy";
import confirmEjectEngineDialog from "lib/electron/dialog/confirmEjectEngineDialog";
import confirmEjectEngineReplaceDialog from "lib/electron/dialog/confirmEjectEngineReplaceDialog";
import ejectEngineToDir from "lib/project/ejectEngineToDir";
import type { ProjectExportType } from "store/features/buildGame/buildGameActions";
import { buildUUID, projectTemplatesRoot } from "consts";
import type { EngineFieldSchema } from "store/features/engine/engineState";
import compileData from "lib/compiler/compileData";
import ejectBuild from "lib/compiler/ejectBuild";
import type {
  Background,
  SpriteSheetData,
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
import { assetFilename } from "shared/lib/helpers/assets";
import toArrayBuffer from "lib/helpers/toArrayBuffer";
import { AssetFolder, potentialAssetFolders } from "lib/project/assets";
import confirmAssetFolder from "lib/electron/dialog/confirmAssetFolder";
import loadProjectData from "lib/project/loadProjectData";
import saveProjectData from "lib/project/saveProjectData";
import saveAsProjectData from "lib/project/saveAsProjectData";
import migrateWarning from "lib/project/migrateWarning";
import confirmReplaceCustomEvent from "lib/electron/dialog/confirmReplaceCustomEvent";
import l10n, { L10NKey, getL10NData } from "shared/lib/lang/l10n";
import initElectronL10N, { locales } from "lib/lang/initElectronL10N";
import watchProject from "lib/project/watchProject";
import { loadBackgroundData } from "lib/project/loadBackgroundData";
import { loadSpriteData } from "lib/project/loadSpriteData";
import { loadMusicData } from "lib/project/loadMusicData";
import { loadSoundData } from "lib/project/loadSoundData";
import { loadFontData } from "lib/project/loadFontData";
import { loadAvatarData } from "lib/project/loadAvatarData";
import { loadEmoteData } from "lib/project/loadEmoteData";
import parseAssetPath from "shared/lib/assets/parseAssetPath";
import { loadEngineFields } from "lib/project/engineFields";
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

declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const SPLASH_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const SPLASH_WINDOW_WEBPACK_ENTRY: string;
declare const PREFERENCES_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const PREFERENCES_WINDOW_WEBPACK_ENTRY: string;
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
let playWindow: BrowserWindow | null = null;
let musicWindow: BrowserWindow | null;

let playWindowSgb = false;
let hasCheckedForUpdate = false;
let documentEdited = false;
let documentName = "";
let projectWindowCloseCancelled = false;
let keepOpen = false;
let projectPath = "";
let cancelBuild = false;
let musicWindowInitialized = false;
let debuggerInitData: DebuggerInitData | null = null;
let stopWatchingFn: (() => void) | null = null;
let scriptEventHandlers: ScriptEventHandlers = {};

const isDevMode = !!process.execPath.match(/[\\/]electron/);

const validProjectExt = [".json", ".gbsproj"];

if (isDevMode) {
  app.whenReady().then(() => {
    installExtension([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS])
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log("An error occurred: ", err));
  });
}

const createSplash = async (forceTab?: SplashTab) => {
  // Create the browser window.
  splashWindow = new BrowserWindow({
    width: 640,
    height: 400,
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

const createPreferences = async () => {
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

const createProjectWindow = async () => {
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
      webSecurity: process.env.NODE_ENV !== "development",
      devTools: isDevMode,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });
  projectWindowCloseCancelled = false;

  projectWindowState.manage(projectWindow);

  projectWindow.loadURL(
    `${MAIN_WINDOW_WEBPACK_ENTRY}?path=${encodeURIComponent(projectPath)}`
  );

  projectWindow.setRepresentedFilename(projectPath);

  projectWindow.webContents.on("did-finish-load", () => {
    sendToProjectWindow("open-project", projectPath);
    setTimeout(() => {
      projectWindow?.show();
    }, 40);
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
    menu.buildMenu([]);

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
      }
      sendToProjectWindow("watch:sprite:changed", filename, data);
    },
    onChangedBackground: async (filename: string) => {
      const data = await loadBackgroundData(projectRoot)(filename);
      if (!data) {
        console.error(`Unable to load asset ${filename}`);
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
      }
      sendToProjectWindow("watch:music:changed", filename, data);
    },
    onChangedSound: async (filename: string) => {
      const data = await loadSoundData(projectRoot)(filename);
      if (!data) {
        console.error(`Unable to load asset ${filename}`);
      }
      sendToProjectWindow("watch:sound:changed", filename, data);
    },
    onChangedFont: async (filename: string) => {
      const data = await loadFontData(projectRoot)(filename);
      if (!data) {
        console.error(`Unable to load asset ${filename}`);
      }
      sendToProjectWindow("watch:font:changed", filename, data);
    },
    onChangedAvatar: async (filename: string) => {
      const data = await loadAvatarData(projectRoot)(filename);
      if (!data) {
        console.error(`Unable to load asset ${filename}`);
      }
      sendToProjectWindow("watch:avatar:changed", filename, data);
    },
    onChangedEmote: async (filename: string) => {
      const data = await loadEmoteData(projectRoot)(filename);
      if (!data) {
        console.error(`Unable to load asset ${filename}`);
      }
      sendToProjectWindow("watch:emote:changed", filename, data);
    },
    onRemoveSprite: async (filename: string) => {
      const { file, plugin } = parseAssetPath(filename, projectRoot, "sprites");
      sendToProjectWindow("watch:sprite:removed", file, plugin);
    },
    onRemoveBackground: async (filename: string) => {
      const { file, plugin } = parseAssetPath(
        filename,
        projectRoot,
        "backgrounds"
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
    onChangedEngineSchema: async (_filename: string) => {
      const fields = await loadEngineFields(projectRoot);
      sendToProjectWindow("watch:engineFields:changed", fields);
    },
    onChangedEventPlugin: async (_filename: string) => {
      // Reload all script event handlers and push new defs to project window
      const projectRoot = Path.dirname(projectPath);
      scriptEventHandlers = await loadAllScriptEventHandlers(projectRoot);
      sendToProjectWindow(
        "watch:scriptEventDefs:changed",
        cloneDictionary(scriptEventHandlers)
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

const createPlay = async (
  url: string,
  sgb: boolean,
  debugEnabled?: boolean
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
        webSecurity: process.env.NODE_ENV !== "development",
        preload: GAME_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
    });
    playWindow.setAlwaysOnTop(true);
    playWindowSgb = sgb;
  } else {
    playWindow.show();
  }

  playWindow.setMenu(null);
  playWindow.loadURL(
    `${url}?audio=true&sgb=${sgb ? "true" : "false"}&debug=${
      !!debugEnabled && !!debuggerInitData ? "true" : "false"
    }`
  );

  playWindow.on("closed", () => {
    playWindow = null;
    sendToProjectWindow("debugger:disconnected");
  });
};

const createMusic = async (sfx?: string, initialMessage?: MusicDataPacket) => {
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
        webSecurity: process.env.NODE_ENV !== "development",
        devTools: isDevMode,
        preload: MUSIC_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
    });
  }

  musicWindow.setMenu(null);
  musicWindow.loadURL(
    `${MUSIC_WINDOW_WEBPACK_ENTRY}#${encodeURIComponent(sfx ?? "")}`
  );

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
]);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  initElectronL10N();

  menu.buildMenu([]);

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

  protocol.registerFileProtocol("gbs", (req, callback) => {
    const { host, pathname } = new URL(req.url);
    if (host === "project") {
      // Load an asset from the current project
      const projectRoot = Path.dirname(projectPath);
      const filename = Path.join(projectRoot, decodeURI(pathname));
      // Check project has permission to access this asset
      guardAssetWithinProject(filename, projectRoot);
      return callback({ path: filename });
    }
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

ipcMain.handle("project:open", async (_event, arg) => {
  const { projectPath } = arg;
  openProject(projectPath);
});

ipcMain.handle("project:open-project-picker", async (_event, _arg) => {
  openProjectPicker();
});

ipcMain.handle("get-recent-projects", async () => {
  const recentProjects = settings.get("recentProjects");
  if (!isStringArray(recentProjects)) return [];
  return recentProjects;
});

ipcMain.handle("clear-recent-projects", async (_event) => {
  settings.set("recentProjects", []);
  app.clearRecentDocuments();
});

ipcMain.handle("open-help", async (_event, helpPage) => {
  if (!isString(helpPage)) throw new Error("Invalid URL");
  openHelp(helpPage);
});

ipcMain.handle("open-folder", async (_event, path) => {
  if (!isString(path)) throw new Error("Invalid Path");
  // @TODO Confirm that folder is within project
  shell.openPath(path);
});

ipcMain.handle("open-image", async (_event, path) => {
  if (!isString(path)) throw new Error("Invalid Path");
  // @TODO Confirm that folder is within project
  const app = String(settings.get("imageEditorPath") || "") || undefined;
  open(path, { app });
});

ipcMain.handle("open-mod", async (_event, path) => {
  if (!isString(path)) throw new Error("Invalid Path");
  // @TODO Confirm that folder is within project
  const app = String(settings.get("musicEditorPath") || "") || undefined;
  open(path, { app });
});

ipcMain.handle("open-file", async (_event, path) => {
  if (!isString(path)) throw new Error("Invalid Path");
  // @TODO Confirm that folder is within project
  shell.openPath(path);
});

ipcMain.handle("open-external", async (_event, url) => {
  if (!isString(url)) throw new Error("Invalid URL");
  const allowedExternalDomains = [
    "https://www.gbstudio.dev",
    "https://www.itch.io",
    "https://github.com",
  ];
  const match = allowedExternalDomains.some((domain) => url.startsWith(domain));
  if (!match) throw new Error("URL not allowed");
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
  }
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
  }
);

ipcMain.handle(
  "dialog:confirm-replace-custom-event",
  async (_event, name: string) => {
    return confirmReplaceCustomEvent(name);
  }
);

ipcMain.handle(
  "dialog:confirm-tracker-unsaved",
  async (_event, name: string) => {
    return confirmUnsavedChangesTrackerDialog(name);
  }
);

ipcMain.handle("dialog:migrate-warning", async (_event, path: string) => {
  return migrateWarning(path);
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

ipcMain.handle("get-documents-path", async (_event) => {
  return app.getPath("documents");
});

ipcMain.handle("get-tmp-path", async () => {
  return getTmp();
});

ipcMain.handle("create-project", async (_event, input: CreateProjectInput) =>
  createProject(input)
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
    showConnections === "selected" || showConnections === true
  );
  setMenuItemChecked("showConnectionsNone", showConnections === false);
  setMenuItemChecked("showNavigator", showNavigator);
});

ipcMain.on(
  "set-menu-plugins",
  (
    _event,
    plugins: Array<{
      id: string;
      plugin: string;
      name: string;
      accelerator: string;
    }>
  ) => {
    const distinct = <T>(value: T, index: number, self: T[]) =>
      self.indexOf(value) === index;

    const pluginValues = Object.values(plugins);

    const pluginNames = pluginValues
      .map((plugin) => plugin.plugin)
      .filter(distinct);

    menu.buildMenu(
      pluginNames.map((pluginName) => {
        return {
          label: pluginName,
          submenu: pluginValues
            .filter((plugin) => {
              return plugin.plugin === pluginName;
            })
            .map((plugin) => {
              return {
                label: l10n(plugin.id as L10NKey) || plugin.name || plugin.name,
                accelerator: plugin.accelerator,
                click() {
                  sendToProjectWindow("menu:plugin-run", plugin.id);
                },
              };
            }),
        };
      })
    );
  }
);

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
  }
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
  const themeId = toThemeId(
    settings.get?.("theme"),
    nativeTheme.shouldUseDarkColors
  );
  return themeId;
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
  }
);

ipcMain.handle("project:load", async (): Promise<{
  data: ProjectData;
  modifiedSpriteIds: string[];
}> => {
  return loadProjectData(projectPath);
});

ipcMain.handle("project:save", async (_, data: ProjectData): Promise<void> => {
  await saveProjectData(projectPath, data);
});

ipcMain.handle(
  "project:save-as",
  async (_, filename: string, data: ProjectData): Promise<void> => {
    await saveAsProjectData(projectPath, filename, data);
  }
);

ipcMain.handle(
  "project:build",
  async (event, project: ProjectData, options: BuildOptions) => {
    cancelBuild = false;

    const { exportBuild, buildType } = options;
    const buildStartTime = Date.now();
    const projectRoot = Path.dirname(projectPath);
    const outputRoot = Path.normalize(`${getTmp()}/${buildUUID}`);
    const colorMode = project.settings.colorMode;
    const sgbEnabled = project.settings.sgbEnabled;
    const debuggerEnabled =
      options.debugEnabled || project.settings.debuggerEnabled;

    try {
      const compiledData = await buildProject(project, {
        ...options,
        projectRoot,
        outputRoot,
        scriptEventHandlers,
        tmpPath: getTmp(),
        debugEnabled: debuggerEnabled,
        progress: (message) => {
          if (cancelBuild) {
            throw new Error("BUILD_CANCELLED");
          }
          if (
            message !== "'" &&
            message.indexOf("unknown or unsupported #pragma") === -1
          ) {
            buildLog(message);
          }
        },
        warnings: (message) => {
          buildErr(message);
        },
      });

      if (exportBuild) {
        await copy(
          `${outputRoot}/build/${buildType}`,
          `${projectRoot}/build/${buildType}`
        );
        shell.openPath(`${projectRoot}/build/${buildType}`);
        buildLog(`-`);
        buildLog(
          `Success! ${
            buildType === "web"
              ? `Site is ready at ${Path.normalize(
                  `${projectRoot}/build/web/index.html`
                )}`
              : `ROM is ready at ${Path.normalize(
                  `${projectRoot}/build/rom/game.gb`
                )}`
          }`
        );
      }

      if (buildType === "web" && !exportBuild) {
        buildLog(`-`);
        buildLog(`Success! Starting emulator...`);
        if (debuggerEnabled) {
          const { memoryMap, globalVariables } = await readDebuggerSymbols(
            outputRoot
          );
          debuggerInitData = {
            memoryMap,
            globalVariables,
            pauseOnScriptChanged: project.settings.debuggerPauseOnScriptChanged,
            pauseOnWatchedVariableChanged:
              project.settings.debuggerPauseOnWatchedVariableChanged,
            breakpoints: project.settings.debuggerBreakpoints.map(
              (breakpoint) => breakpoint.scriptEventId
            ),
            watchedVariables: project.settings.debuggerWatchedVariables,
            variableMap: keyBy(Object.values(compiledData.variableMap), "id"),
          };
          const gbvmScripts = pickBy(compiledData.files, (_, key) =>
            key.endsWith(".s")
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
          debuggerEnabled
        );
      }

      const buildTime = Date.now() - buildStartTime;
      buildLog(`Build Time: ${buildTime}ms`);
    } catch (e) {
      if (typeof e === "string") {
        buildErr(e);
      } else if (e instanceof Error && e.message === "BUILD_CANCELLED") {
        buildLog(l10n("BUILD_CANCELLED"));
      } else if (e instanceof Error) {
        buildErr(e.toString());
      }
      throw e;
    }
  }
);

ipcMain.handle("project:build-cancel", () => {
  cancelBuild = true;
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
    project: ProjectData,
    engineFields: EngineFieldSchema[],
    exportType: ProjectExportType
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

      const tmpPath = getTmp();

      // Compile project data
      const compiledData = await compileData(project, {
        projectRoot,
        engineFields,
        scriptEventHandlers,
        tmpPath,
        progress,
        warnings,
      });

      // Export compiled data to a folder
      await ejectBuild({
        projectType: "gb",
        projectRoot,
        tmpPath,
        projectData: project,
        engineFields,
        outputRoot,
        compiledData,
        progress,
        warnings,
      });

      const exportRoot = `${projectRoot}/build/src`;

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
      buildLog(`Build Time: ${buildTime}ms`);

      shell.openPath(exportRoot);
    } catch (e) {
      if (typeof e === "string") {
        buildErr(e);
      } else if (e instanceof Error) {
        buildErr(e.toString());
      }
      throw e;
    }
  }
);

ipcMain.handle(
  "project:get-background-info",
  (_event, background: Background, is360: boolean, cgbOnly: boolean) => {
    const projectRoot = Path.dirname(projectPath);
    return getBackgroundInfo(background, is360, cgbOnly, projectRoot);
  }
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
          filename
        )}`;

        const isInProject = Path.relative(filename, destPath) === "";

        if (!isInProject) {
          await copyFile(filename, destPath);
        }
      }
    }
  }
);

ipcMain.handle("tracker:new", async (_event, filename: string) => {
  const projectRoot = Path.dirname(projectPath);
  // Check project has permission to access this asset
  guardAssetWithinProject(filename, projectRoot);

  const templatePath = `${projectTemplatesRoot}/gbhtml/assets/music/template.uge`;
  const copy2 = async (oPath: string, path: string) => {
    try {
      const exists = await pathExists(path);
      if (!exists) {
        await copy(oPath, path, {
          overwrite: false,
          errorOnExist: true,
        });
        return path;
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
        await copy2(oPath, newPath);
        return newPath;
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  };
  return await copy2(templatePath, filename);
});

ipcMain.handle("tracker:load", async (_event, filename: string) => {
  const projectRoot = Path.dirname(projectPath);
  // Check project has permission to access this asset
  guardAssetWithinProject(filename, projectRoot);
  // Convert song to UGE format and save
  const data = await readFile(filename);
  const song = loadUGESong(new Uint8Array(data).buffer);
  if (song) {
    song.filename = filename;
  }
  return song;
});

ipcMain.handle("tracker:save", async (_event, song: Song) => {
  const projectRoot = Path.dirname(projectPath);
  const filename = song.filename;
  // Check project has permission to access this asset
  guardAssetWithinProject(filename, projectRoot);
  // Convert song to UGE format and save
  const buffer = saveUGESong(song);
  await writeFileWithBackupAsync(filename, new Uint8Array(buffer), "utf8");
});

ipcMain.handle("sfx:play-wav", async (_event, filename: string) => {
  const projectRoot = Path.dirname(projectPath);
  // Check project has permission to access this asset
  guardAssetWithinProject(filename, projectRoot);
  const sfx = await compileWav(filename, "asm");
  createMusic(sfx, {
    action: "play-sound",
  });
});

ipcMain.handle("sfx:play-vgm", async (_event, filename: string) => {
  const projectRoot = Path.dirname(projectPath);
  // Check project has permission to access this asset
  guardAssetWithinProject(filename, projectRoot);
  const { output: sfx } = await compileVGM(filename, "asm");
  createMusic(sfx, {
    action: "play-sound",
  });
});

ipcMain.handle(
  "sfx:play-fxhammer",
  async (_event, filename: string, effectIndex: number) => {
    const projectRoot = Path.dirname(projectPath);
    // Check project has permission to access this asset
    guardAssetWithinProject(filename, projectRoot);
    const { output: sfx } = await compileFXHammerSingle(
      filename,
      effectIndex,
      "asm"
    );
    createMusic(sfx, {
      action: "play-sound",
    });
  }
);

ipcMain.handle("music:play-uge", async (_event, filename: string) => {
  const projectRoot = Path.dirname(projectPath);
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
    spriteData: SpriteSheetData
  ): Promise<PrecompiledSpriteSheetData> => {
    const projectRoot = Path.dirname(projectPath);
    const filename = assetFilename(projectRoot, "sprites", spriteData);
    // Check project has permission to access this asset
    guardAssetWithinProject(filename, projectRoot);
    return compileSprite(spriteData, projectRoot);
  }
);

ipcMain.handle(
  "script:get-auto-label",
  async (_, command: string, args: Record<string, unknown>) => {
    return getAutoLabel(command, args, scriptEventHandlers);
  }
);

ipcMain.handle(
  "script:post-update-fn",
  async (
    _,
    command: string,
    fieldKey: string,
    args: Record<string, unknown>,
    prevArgs: Record<string, unknown>
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
  }
);

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
      "Have you selected a song?"
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

menu.on("updateTheme", (value) => {
  settings.set("theme", value as JsonValue);
  setMenuItemChecked("themeDefault", value === undefined);
  setMenuItemChecked("themeLight", value === "light");
  setMenuItemChecked("themeDark", value === "dark");
  const newThemeId = toThemeId(value, nativeTheme.shouldUseDarkColors);
  sendToSplashWindow("update-theme", newThemeId);
  sendToProjectWindow("update-theme", newThemeId);
});

menu.on("updateLocale", (value) => {
  settings.set("locale", value as JsonValue);
  setMenuItemChecked("localeDefault", value === undefined);
  for (const locale of locales) {
    setMenuItemChecked(`locale-${locale}`, value === locale);
  }
  switchLanguageDialog();
  initElectronL10N();
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
    value === "selected" || value === true
  );
  setMenuItemChecked("showConnectionsNone", value === false);
  sendToProjectWindow("setting:changed", "showConnections", value);
});

menu.on("updateShowNavigator", (value) => {
  settings.set("showNavigator", value as JsonValue);
  sendToProjectWindow("setting:changed", "showNavigator", value);
});

nativeTheme?.on("updated", () => {
  const themeId = toThemeId(
    settings.get?.("theme"),
    nativeTheme.shouldUseDarkColors
  );
  sendToSplashWindow("update-theme", themeId);
  sendToProjectWindow("update-theme", themeId);
});

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

const openProject = async (newProjectPath: string) => {
  const ext = Path.extname(newProjectPath);
  if (validProjectExt.indexOf(ext) === -1) {
    dialog.showErrorBox(
      l10n("ERROR_INVALID_FILE_TYPE"),
      l10n("ERROR_OPEN_GBSPROJ_FILE")
    );
    return;
  }

  try {
    await stat(newProjectPath);
  } catch (e) {
    dialog.showErrorBox(
      l10n("ERROR_MISSING_PROJECT"),
      l10n("ERROR_MOVED_OR_DELETED")
    );
    return;
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
          arr.indexOf(filename) === index
      ) // Only unique
      .reverse()
      .slice(-10)
  );
  app.addRecentDocument(projectPath);
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
  const projectName = Path.parse(saveAsPath).name;
  const projectDir = Path.join(Path.dirname(saveAsPath), projectName);
  const projectPath = Path.join(projectDir, Path.basename(saveAsPath));

  let projectExists;
  try {
    await stat(projectPath);
    projectExists = true;
  } catch (e) {
    projectExists = false;
  }
  if (projectExists) {
    dialog.showErrorBox(
      l10n("ERROR_PROJECT_ALREADY_EXISTS"),
      l10n("ERROR_PLEASE_SELECT_A_DIFFERENT_LOCATION")
    );
    return;
  }

  const ext = Path.extname(saveAsPath);
  if (validProjectExt.indexOf(ext) === -1) {
    dialog.showErrorBox(
      l10n("ERROR_INVALID_FILE_TYPE"),
      l10n("ERROR_OPEN_GBSPROJ_FILE")
    );
    return;
  }

  addRecentProject(projectPath);

  sendToProjectWindow("menu:save-as-project", projectPath);
};
