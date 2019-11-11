import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import installExtension, {
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS
} from "electron-devtools-installer";
import { enableLiveReload, addBypassChecker } from "electron-compile";
import windowStateKeeper from "electron-window-state";
import settings from "electron-settings";
import Path from "path";
import { stat } from "fs-extra";
import menu from "./menu";
import { checkForUpdate } from "./lib/helpers/updateChecker";
import switchLanguageDialog from "./lib/electron/dialog/switchLanguageDialog";

// Stop app launching during squirrel install
// eslint-disable-next-line global-require
if (require("electron-squirrel-startup")) {
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;
let splashWindow = null;
let playWindow = null;
let hasCheckedForUpdate = false;

const isDevMode = process.execPath.match(/[\\/]electron/);

const validProjectExt = [".json", ".gbsproj"];

// Allow images and json outside of application package to be loaded in production build
addBypassChecker(filePath => {
  return (
    // filePath.indexOf(app.getAppPath()) === -1 ||
    filePath.indexOf("/dist/") > -1 ||
    filePath.indexOf("build/web") > -1 ||
    /.mod/.test(filePath) ||
    /.jpg/.test(filePath) ||
    /.json/.test(filePath) ||
    /.png/.test(filePath) ||
    /.mem/.test(filePath)
  );
});

const createSplash = async (forceNew = false) => {
  // Create the browser window.
  splashWindow = new BrowserWindow({
    width: 700,
    height: 432,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      devTools: isDevMode
    }
  });

  splashWindow.setMenu(null);
  splashWindow.loadURL(
    `file://${__dirname}/windows/splash.html?new=${forceNew}`
  );

  splashWindow.webContents.on("did-finish-load", () => {
    setTimeout(() => {
      splashWindow.show();
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

const createWindow = async projectPath => {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800
  });

  // Create the browser window.
  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: Math.max(800, mainWindowState.width),
    height: Math.max(600, mainWindowState.height),
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: "hiddenInset",
    fullscreenable: false,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
      devTools: isDevMode
    }
  });

  // Enable documentEdited functionality on windows
  Object.defineProperty(mainWindow, "documentEdited", {
    value: false,
    configurable: true,
    enumerable: true,
    writable: true
  });

  mainWindowState.manage(mainWindow);

  mainWindow.loadURL(
    `file://${__dirname}/windows/project.html?path=${encodeURIComponent(
      projectPath
    )}`
  );

  mainWindow.setRepresentedFilename(projectPath);

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send("open-project", projectPath);
    setTimeout(() => {
      mainWindow.show();
    }, 40);
  });

  mainWindow.on("enter-full-screen", () => {
    mainWindow.webContents.send("enter-full-screen");
  });

  mainWindow.on("leave-full-screen", () => {
    mainWindow.webContents.send("leave-full-screen");
  });

  mainWindow.on("page-title-updated", (e, title) => {
    mainWindow.name = title;
  });

  mainWindow.on("close", e => {
    if (mainWindow.documentEdited) {
      // eslint-disable-next-line global-require
      const l10n = require("./lib/helpers/l10n").default;
      const choice = dialog.showMessageBox(mainWindow, {
        type: "question",
        buttons: [
          l10n("DIALOG_SAVE"),
          l10n("DIALOG_CANCEL"),
          l10n("DIALOG_DONT_SAVE")
        ],
        defaultId: 0,
        cancelId: 1,
        message: l10n("DIALOG_SAVE_CHANGES", { name: mainWindow.name }),
        detail: l10n("DIALOG_SAVE_WARNING")
      });
      if (choice === 0) {
        // Save
        e.preventDefault();
        mainWindow.webContents.send("save-project-and-close");
      } else if (choice === 1) {
        // Cancel
        e.preventDefault();
      } else {
        // Don't Save
      }
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
    menu.buildMenu([]);
  });
};

const openHelp = async helpPage => {
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

const createPlay = async url => {
  if (!playWindow) {
    const playWidth = process.platform === "win32" ? 494 : 480;
    const playHeight = process.platform === "win32" ? 471 : 454;

    // Create the browser window.
    playWindow = new BrowserWindow({
      width: playWidth,
      height: playHeight,
      fullscreenable: false,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        webSecurity: false
      }
    });
  } else {
    playWindow.show();
  }

  playWindow.setMenu(null);
  playWindow.loadURL(`${url}?audio=true`);

  playWindow.on("closed", () => {
    playWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  // Enable DevTools.
  if (isDevMode) {
    enableLiveReload({ strategy: "react-hmr" });
    await installExtension(REACT_DEVELOPER_TOOLS);
    await installExtension(REDUX_DEVTOOLS);
  }

  const lastArg = process.argv[process.argv.length - 1];
  if (
    process.argv.length >= 2 &&
    lastArg !== "." &&
    lastArg.indexOf("-") !== 0
  ) {
    openProject(lastArg);
  } else if (splashWindow === null && mainWindow === null) {
    createSplash();
  }
});

app.on("open-file", async (e, projectPath) => {
  await app.whenReady();
  openProject(projectPath);
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (splashWindow === null && mainWindow === null) {
    createSplash();
  }
});

ipcMain.on("open-project", async (event, arg) => {
  const { projectPath } = arg;
  openProject(projectPath);
});

ipcMain.on("check-full-screen", async (event, arg) => {
  if (mainWindow) {
    if (mainWindow.isFullScreen()) {
      mainWindow.webContents.send("enter-full-screen");
    } else {
      mainWindow.webContents.send("leave-full-screen");
    }
  }
});

ipcMain.on("open-project-picker", async (event, arg) => {
  openProjectPicker();
});

ipcMain.on("request-recent-projects", async event => {
  splashWindow &&
    splashWindow.webContents.send(
      "recent-projects",
      settings.get("recentProjects")
    );
});

ipcMain.on("clear-recent-projects", async event => {
  settings.set("recentProjects", []);
  app.clearRecentDocuments();
});

ipcMain.on("open-help", async (event, helpPage) => {
  openHelp(helpPage);
});

ipcMain.on("open-play", async (event, url) => {
  createPlay(url);
});

ipcMain.on("document-modified", () => {
  mainWindow.setDocumentEdited(true);
  mainWindow.documentEdited = true; // For Windows
});

ipcMain.on("document-unmodified", () => {
  mainWindow.setDocumentEdited(false);
  mainWindow.documentEdited = false; // For Windows
});

ipcMain.on("project-loaded", (event, project) => {
  const { showCollisions, showConnections } = project.settings;
  menu.ref().getMenuItemById("showCollisions").checked = showCollisions;
  menu.ref().getMenuItemById("showConnections").checked = showConnections;
});

ipcMain.on("set-menu-plugins", (event, plugins) => {
  // eslint-disable-next-line global-require
  const l10n = require("./lib/helpers/l10n").default;
  const distinct = (value, index, self) => self.indexOf(value) === index;

  const pluginValues = Object.values(plugins);

  const pluginNames = pluginValues
    .map(plugin => plugin.plugin)
    .filter(distinct);

  menu.buildMenu(
    pluginNames.map(pluginName => {
      return {
        label: pluginName,
        submenu: pluginValues
          .filter(plugin => {
            return plugin.plugin === pluginName;
          })
          .map(plugin => {
            return {
              label: l10n(plugin.id) || plugin.name || plugin.name,
              accelerator: plugin.accelerator,
              click() {
                mainWindow &&
                  mainWindow.webContents.send("plugin-run", plugin.id);
              }
            };
          })
      };
    })
  );
});

menu.on("new", async () => {
  newProject();
});

menu.on("open", async () => {
  openProjectPicker();
});

menu.on("save", async () => {
  mainWindow && mainWindow.webContents.send("save-project");
});

menu.on("undo", async () => {
  mainWindow && mainWindow.webContents.send("undo");
});

menu.on("redo", async () => {
  mainWindow && mainWindow.webContents.send("redo");
});

menu.on("section", async section => {
  mainWindow && mainWindow.webContents.send("section", section);
});

menu.on("reloadAssets", () => {
  mainWindow && mainWindow.webContents.send("reloadAssets");
});

menu.on("zoom", zoomType => {
  mainWindow && mainWindow.webContents.send("zoom", zoomType);
});

menu.on("run", () => {
  mainWindow && mainWindow.webContents.send("run");
});

menu.on("build", buildType => {
  mainWindow && mainWindow.webContents.send("build", buildType);
});

menu.on("checkUpdates", () => {
  checkForUpdate(true);
});

menu.on("updateSetting", (setting, value) => {
  settings.set(setting, value);
  if (setting === "theme") {
    menu.ref().getMenuItemById("themeDefault").checked = value === undefined;
    menu.ref().getMenuItemById("themeLight").checked = value === "light";
    menu.ref().getMenuItemById("themeDark").checked = value === "dark";
    splashWindow && splashWindow.webContents.send("update-theme", value);
    mainWindow && mainWindow.webContents.send("update-theme", value);
  } else if (setting === "locale") {
    const locales = require("./lib/helpers/l10n").locales;
    menu.ref().getMenuItemById("localeDefault").checked = value === undefined;
    for (let locale of locales) {
      menu.ref().getMenuItemById(`locale-${locale}`).checked = value === locale;
    }
    switchLanguageDialog();
  } else {
    mainWindow && mainWindow.webContents.send("updateSetting", setting, value);
  }
});

const newProject = async () => {
  if (splashWindow) {
    splashWindow.close();
    await createSplash(true);
  } else {
    await createSplash(true);
    if (mainWindow) {
      mainWindow.close();
    }
  }
};

const openProjectPicker = async () => {
  const files = dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      {
        name: "Projects",
        extensions: ["gbsproj", "json"]
      }
    ]
  });
  if (files && files[0]) {
    openProject(files[0]);
  }
};

const openProject = async projectPath => {
  // eslint-disable-next-line global-require
  const l10n = require("./lib/helpers/l10n").default;
  const ext = Path.extname(projectPath);
  if (validProjectExt.indexOf(ext) === -1) {
    dialog.showErrorBox(
      l10n("ERROR_INVALID_FILE_TYPE"),
      l10n("ERROR_OPEN_GBSPROJ_FILE")
    );
    return;
  }

  try {
    await stat(projectPath);
  } catch (e) {
    dialog.showErrorBox(
      l10n("ERROR_MISSING_PROJECT"),
      l10n("ERROR_MOVED_OR_DELETED")
    );
    return;
  }

  // Store recent projects
  settings.set(
    "recentProjects",
    []
      .concat(settings.get("recentProjects") || [], projectPath)
      .reverse()
      .filter((filename, index, arr) => arr.indexOf(filename) === index) // Only unique
      .reverse()
      .slice(-10)
  );
  app.addRecentDocument(projectPath);

  const oldMainWindow = mainWindow;
  await createWindow(projectPath);
  const newMainWindow = mainWindow;
  if (splashWindow) {
    splashWindow.close();
  }
  if (oldMainWindow) {
    oldMainWindow.close();
    mainWindow = newMainWindow;
  }
};
