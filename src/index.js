import electron, { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import installExtension, {
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS
} from "electron-devtools-installer";
import { enableLiveReload, addBypassChecker } from "electron-compile";
import windowStateKeeper from "electron-window-state";
import menu from "./menu";
import Path from "path";
import l10n from "./lib/helpers/l10n";

// Stop app launching during squirrel install
if (require("electron-squirrel-startup")) {
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;
let splashWindow = null;
let playWindow = null;

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

const createSplash = async () => {
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
  splashWindow.loadURL(`file://${__dirname}/windows/splash.html`);

  splashWindow.webContents.on("did-finish-load", function() {
    setTimeout(function() {
      splashWindow.show();
    }, 40);
  });

  splashWindow.on("closed", () => {
    splashWindow = null;
  });
};

const createWindow = async projectPath => {
  let mainWindowState = windowStateKeeper({
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

  mainWindow.webContents.on("did-finish-load", function() {
    mainWindow.webContents.send("ping", "whoooooooh!");
    mainWindow.webContents.send("open-project", projectPath);
    setTimeout(function() {
      mainWindow.show();
    }, 40);
  });

  mainWindow.on("enter-full-screen", () => {
    mainWindow.webContents.send("enter-full-screen");
  });

  mainWindow.on("leave-full-screen", () => {
    mainWindow.webContents.send("leave-full-screen");
  });

  mainWindow.on("close", e => {
    if (mainWindow.documentEdited) {
      const choice = require("electron").dialog.showMessageBox(mainWindow, {
        type: "question",
        buttons: ["Quit", "Cancel"],
        title: "Confirm",
        message:
          "You have unsaved changes, are you sure you want to close this project?"
      });
      if (choice == 1) {
        return e.preventDefault();
      }
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
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

  if (splashWindow === null && mainWindow === null) {
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
  if (mainWindow.isFullScreen()) {
    mainWindow.webContents.send("enter-full-screen");
  } else {
    mainWindow.webContents.send("leave-full-screen");
  }
});

ipcMain.on("open-project-picker", async (event, arg) => {
  openProjectPicker();
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
  menu.ref().getMenuItemById("showCollisions").checked =
    project.settings.showCollisions;
  menu.ref().getMenuItemById("showConnections").checked =
    project.settings.showConnections;
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

menu.on("zoom", zoomType => {
  mainWindow && mainWindow.webContents.send("zoom", zoomType);
});

menu.on("run", () => {
  mainWindow && mainWindow.webContents.send("run");
});

menu.on("build", buildType => {
  mainWindow && mainWindow.webContents.send("build", buildType);
});

menu.on("updateSetting", (setting, value) => {
  mainWindow && mainWindow.webContents.send("updateSetting", setting, value);
});

const newProject = async () => {
  if (splashWindow) {
    splashWindow.reload();
  } else {
    await createSplash();
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
        extensions: "json"
      }
    ]
  });
  if (files && files[0]) {
    openProject(files[0]);
  }
};

const openProject = async projectPath => {
  const ext = Path.extname(projectPath);
  if (validProjectExt.indexOf(ext) === -1) {
    dialog.showErrorBox(
      l10n("ERROR_INVALID_FILE_TYPE"),
      l10n("ERROR_OPEN_GBSPROJ_FILE")
    );
    return;
  }

  let oldMainWindow = mainWindow;
  await createWindow(projectPath);
  let newMainWindow = mainWindow;
  if (splashWindow) {
    splashWindow.close();
  }
  if (oldMainWindow) {
    oldMainWindow.close();
    mainWindow = newMainWindow;
  }
};
