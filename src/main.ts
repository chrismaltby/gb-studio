import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  nativeTheme,
  clipboard,
} from "electron";
import windowStateKeeper from "electron-window-state";
import settings from "electron-settings";
import Path from "path";
import { remove, stat, statSync } from "fs-extra";
import menu from "./menu";
import { checkForUpdate } from "lib/helpers/updateChecker";
import switchLanguageDialog from "lib/electron/dialog/switchLanguageDialog";
import l10n, { l10nStrings, locales } from "lib/helpers/l10n";
import initElectronL10n, {
  forceL10nReload,
} from "lib/helpers/initElectronL10n";
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
import { buildUUID } from "consts";
import type { EngineFieldSchema } from "store/features/engine/engineState";
import compileData from "lib/compiler/compileData";
import ejectBuild from "lib/compiler/ejectBuild";

declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const SPLASH_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const SPLASH_WINDOW_WEBPACK_ENTRY: string;
declare const PREFERENCES_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const PREFERENCES_WINDOW_WEBPACK_ENTRY: string;
declare const MUSIC_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MUSIC_WINDOW_WEBPACK_ENTRY: string;

type SplashTab = "info" | "new" | "recent";

// Stop app launching during squirrel install
// eslint-disable-next-line global-require
if (require("electron-squirrel-startup")) {
  app.quit();
}

app.allowRendererProcessReuse = false;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let preferencesWindow: BrowserWindow | null = null;
let playWindow: BrowserWindow | null = null;
let musicWindow: BrowserWindow | null;

let playWindowSgb = false;
let hasCheckedForUpdate = false;
let documentEdited = false;
let documentName = "";
let mainWindowCloseCancelled = false;
let keepOpen = false;
let projectPath = "";
let cancelBuild = false;

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
      nodeIntegration: true,
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
      nodeIntegration: true,
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
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800,
  });

  // Create the browser window.
  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: Math.max(640, mainWindowState.width),
    height: Math.max(600, mainWindowState.height),
    minWidth: 640,
    minHeight: 600,
    titleBarStyle: "hiddenInset",
    fullscreenable: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      webSecurity: process.env.NODE_ENV !== "development",
      devTools: isDevMode,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });
  mainWindowCloseCancelled = false;

  mainWindowState.manage(mainWindow);

  mainWindow.loadURL(
    `${MAIN_WINDOW_WEBPACK_ENTRY}?path=${encodeURIComponent(projectPath)}`
  );

  mainWindow.setRepresentedFilename(projectPath);

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow?.webContents.send("open-project", projectPath);
    setTimeout(() => {
      mainWindow?.show();
    }, 40);
  });

  mainWindow.on("enter-full-screen", () => {
    mainWindow?.webContents.send("is-full-screen-changed", true);
  });

  mainWindow.on("leave-full-screen", () => {
    mainWindow?.webContents.send("is-full-screen-changed", false);
  });

  mainWindow.on("page-title-updated", (e, title) => {
    documentName = title
      .replace(/^GB Studio -/, "")
      .replace(/\(modified\)$/, "")
      .trim();
  });

  mainWindow.on("close", (e) => {
    if (documentEdited && mainWindow) {
      mainWindowCloseCancelled = false;
      const choice = dialog.showMessageBoxSync(mainWindow, {
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
        mainWindow.webContents.send("save-project-and-close");
      } else if (choice === 1) {
        // Cancel
        e.preventDefault();
        keepOpen = false;
        mainWindowCloseCancelled = true;
      } else {
        // Don't Save
      }
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
    menu.buildMenu([]);

    if (musicWindow) {
      musicWindow.destroy();
    }
  });
};

const buildLog = (msg: string) =>
  mainWindow?.webContents.send("build:log", msg);
const buildErr = (msg: string) =>
  mainWindow?.webContents.send("build:error", msg);

const waitUntilWindowClosed = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const check = () => {
      if (mainWindow === null) {
        resolve();
      } else if (mainWindowCloseCancelled) {
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

const createPlay = async (url: string, sgb: boolean) => {
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
        nodeIntegration: false,
        webSecurity: process.env.NODE_ENV !== "development",
      },
    });
    playWindowSgb = sgb;
  } else {
    playWindow.show();
  }

  playWindow.setMenu(null);
  playWindow.loadURL(`${url}?audio=true&sgb=${sgb ? "true" : "false"}`);

  playWindow.on("closed", () => {
    playWindow = null;
  });
};

const createMusic = async (sfx?: string) => {
  if (!musicWindow) {
    // Create the browser window.
    musicWindow = new BrowserWindow({
      show: false,
      width: 330,
      height: 330,
      webPreferences: {
        nodeIntegration: true,
        nodeIntegrationInWorker: true,
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
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  initElectronL10n();

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
  } else if (splashWindow === null && mainWindow === null) {
    createSplash();
  }
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
  if (splashWindow === null && mainWindow === null) {
    createSplash();
  }
});

ipcMain.on("open-project", async (_event, arg) => {
  const { projectPath } = arg;
  openProject(projectPath);
});

ipcMain.on("open-project-picker", async (_event, _arg) => {
  openProjectPicker();
});

ipcMain.on("request-recent-projects", async (_event) => {
  splashWindow &&
    splashWindow.webContents.send(
      "recent-projects",
      settings.get("recentProjects")
    );
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

ipcMain.on("open-play", async (_event, url, sgb) => {
  createPlay(url, sgb);
});

ipcMain.handle("open-folder", async (_event, path) => {
  if (!isString(path)) throw new Error("Invalid Path");
  // @TODO Confirm that folder is within project
  shell.openItem(path);
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
  shell.openItem(path);
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
  return confirmEnableColorDialog();
});

ipcMain.handle(
  "dialog:confirm-delete-custom-event",
  async (_event, name: string, sceneNames: string[], count: number) => {
    return confirmDeleteCustomEvent(name, sceneNames, count);
  }
);

ipcMain.handle("close-project", () => {
  mainWindow?.close();
});

ipcMain.on("document-modified", () => {
  mainWindow?.setDocumentEdited(true);
  documentEdited = true; // For Windows
});

ipcMain.on("document-unmodified", () => {
  mainWindow?.setDocumentEdited(false);
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

ipcMain.on("project-loaded", (_event, settings) => {
  const { showCollisions, showConnections, showNavigator } = settings;
  menu.ref().getMenuItemById("showCollisions").checked = showCollisions;
  menu.ref().getMenuItemById("showConnectionsAll").checked =
    showConnections === "all";
  menu.ref().getMenuItemById("showConnectionsSelected").checked =
    showConnections === "selected" || showConnections === true;
  menu.ref().getMenuItemById("showConnectionsNone").checked =
    showConnections === false;
  menu.ref().getMenuItemById("showNavigator").checked = showNavigator;
});

ipcMain.on("set-show-navigator", (_event, showNavigator) => {
  menu.ref().getMenuItemById("showNavigator").checked = showNavigator;
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
                label: l10n(plugin.id) || plugin.name || plugin.name,
                accelerator: plugin.accelerator,
                click() {
                  mainWindow &&
                    mainWindow.webContents.send("plugin-run", plugin.id);
                },
              };
            }),
        };
      })
    );
  }
);

ipcMain.on("open-music", async (_event, sfx) => {
  createMusic(sfx);
});

ipcMain.handle("set-ui-scale", (_, scale: number) => {
  settings.set("zoomLevel", scale);
  mainWindow && mainWindow.webContents.send("windowZoom", scale);
});

ipcMain.handle("set-tracker-keybindings", (_, value: number) => {
  settings.set("trackerKeyBindings", value);
  mainWindow && mainWindow.webContents.send("keybindings-update", value);
});

ipcMain.on("close-music", async () => {
  if (musicWindow) {
    musicWindow.destroy();
  }
});

ipcMain.on("music-data-send", (_event, data) => {
  if (musicWindow) {
    musicWindow.webContents.send("music-data", data);
  }
});

ipcMain.on("music-data-receive", (_event, data) => {
  if (mainWindow) {
    mainWindow.webContents.send("music-data", data);
  }
});

ipcMain.handle("get-l10n-strings", () => l10nStrings);
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

ipcMain.handle("get-is-full-screen", async () => {
  if (mainWindow) {
    return mainWindow.isFullScreen();
  }
  return false;
});

ipcMain.handle("clipboard-read-text", () => {
  return clipboard.readText();
});

ipcMain.handle(
  "project:build",
  async (event, project: ProjectData, options: BuildOptions) => {
    cancelBuild = false;

    const { exportBuild, buildType } = options;
    const buildStartTime = Date.now();
    const projectRoot = Path.dirname(projectPath);
    const outputRoot = Path.normalize(`${getTmp()}/${buildUUID}`);
    const colorEnabled = project.settings.customColorsEnabled;
    const sgbEnabled = project.settings.sgbEnabled;

    try {
      await buildProject(project, {
        ...options,
        projectRoot,
        outputRoot,
        tmpPath: getTmp(),
        progress: (message) => {
          if (cancelBuild) {
            throw new Error(l10n("BUILD_CANCELLED"));
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
        shell.openItem(`${projectRoot}/build/${buildType}`);
        buildLog(`-`);
        mainWindow?.webContents.send(
          "build:log",
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
        mainWindow?.webContents.send(
          "build:log",
          `Success! Starting emulator...`
        );
        createPlay(
          `file://${outputRoot}/build/web/index.html`,
          sgbEnabled && !colorEnabled
        );
      }

      const buildTime = Date.now() - buildStartTime;
      buildLog(`Build Time: ${buildTime}ms`);
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
    shell.openItem(outputDir);
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
        tmpPath,
        progress,
        warnings,
      });

      // Export compiled data to a folder
      await ejectBuild({
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

      shell.openItem(exportRoot);
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
  mainWindow && mainWindow.webContents.send("save-project");
});

menu.on("saveAs", async () => {
  saveAsProjectPicker();
});

menu.on("undo", async () => {
  mainWindow && mainWindow.webContents.send("undo");
});

menu.on("redo", async () => {
  mainWindow && mainWindow.webContents.send("redo");
});

menu.on("section", async (section) => {
  mainWindow && mainWindow.webContents.send("section", section);
});

menu.on("reloadAssets", () => {
  mainWindow && mainWindow.webContents.send("reloadAssets");
});

menu.on("zoom", (zoomType) => {
  mainWindow && mainWindow.webContents.send("zoom", zoomType);
});

menu.on("run", () => {
  mainWindow && mainWindow.webContents.send("run");
});

menu.on("build", (buildType) => {
  mainWindow && mainWindow.webContents.send("build", buildType);
});

menu.on("ejectEngine", () => {
  mainWindow && mainWindow.webContents.send("ejectEngine");
});

menu.on("exportProjectSrc", () => {
  mainWindow && mainWindow.webContents.send("exportProject", "src");
});

menu.on("exportProjectData", () => {
  mainWindow && mainWindow.webContents.send("exportProject", "data");
});

menu.on("pasteInPlace", () => {
  mainWindow && mainWindow.webContents.send("paste-in-place");
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
  menu.ref().getMenuItemById("themeDefault").checked = value === undefined;
  menu.ref().getMenuItemById("themeLight").checked = value === "light";
  menu.ref().getMenuItemById("themeDark").checked = value === "dark";
  const newThemeId = toThemeId(value, nativeTheme.shouldUseDarkColors);
  splashWindow && splashWindow.webContents.send("update-theme", newThemeId);
  mainWindow && mainWindow.webContents.send("update-theme", newThemeId);
});

menu.on("updateLocale", (value) => {
  settings.set("locale", value as JsonValue);
  menu.ref().getMenuItemById("localeDefault").checked = value === undefined;
  for (const locale of locales) {
    menu.ref().getMenuItemById(`locale-${locale}`).checked = value === locale;
  }
  switchLanguageDialog();
  forceL10nReload();
});

menu.on("updateShowCollisions", (value) => {
  settings.set("showCollisions", value as JsonValue);
  mainWindow &&
    mainWindow.webContents.send("updateSetting", "showCollisions", value);
});

menu.on("updateShowConnections", (value) => {
  settings.set("showConnections", value as JsonValue);
  menu.ref().getMenuItemById("showConnectionsAll").checked = value === "all";
  menu.ref().getMenuItemById("showConnectionsSelected").checked =
    value === "selected" || value === true;
  menu.ref().getMenuItemById("showConnectionsNone").checked = value === false;
  mainWindow &&
    mainWindow.webContents.send("updateSetting", "showConnections", value);
});

menu.on("updateShowNavigator", (value) => {
  settings.set("showNavigator", value as JsonValue);
  mainWindow &&
    mainWindow.webContents.send("updateSetting", "showNavigator", value);
});

nativeTheme?.on("updated", () => {
  const themeId = toThemeId(
    settings.get?.("theme"),
    nativeTheme.shouldUseDarkColors
  );
  splashWindow && splashWindow.webContents.send("update-theme", themeId);
  mainWindow && mainWindow.webContents.send("update-theme", themeId);
});

const newProject = async () => {
  keepOpen = true;
  if (splashWindow) {
    splashWindow.close();
    await waitUntilSplashClosed();
  }
  if (mainWindow) {
    mainWindow.close();
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
    if (mainWindow) {
      mainWindow.close();
      await waitUntilWindowClosed();
    }

    openProject(files[0]);

    keepOpen = false;
  }
};

const switchProject = async () => {
  keepOpen = true;
  if (mainWindow) {
    mainWindow.close();
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

  keepOpen = true;

  if (mainWindow) {
    mainWindow.close();
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

  mainWindow && mainWindow.webContents.send("save-as-project", projectPath);
};
