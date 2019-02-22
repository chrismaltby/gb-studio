import electron, { app, BrowserWindow, ipcMain, dialog } from "electron";
import installExtension, {
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS
} from "electron-devtools-installer";
import { enableLiveReload, addBypassChecker } from "electron-compile";
import windowStateKeeper from "electron-window-state";
import menu from "./menu";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;
let splashWindow = null;
let helpWindow = null;

const isDevMode = process.execPath.match(/[\\/]electron/);

if (isDevMode) enableLiveReload({ strategy: "react-hmr" });

// Allow images and json outside of application package to be loaded in production build
addBypassChecker(filePath => {
  return (
    filePath.indexOf(app.getAppPath()) === -1 &&
    (/.jpg/.test(filePath) || /.json/.test(filePath) || /.png/.test(filePath))
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
    webPreferences: {
      nodeIntegration: true,
      devTools: isDevMode
    }
  });

  // and load the index.html of the app.
  splashWindow.loadURL(`file://${__dirname}/windows/splash.html`);

  // Open the DevTools.
  if (isDevMode) {
    console.log("IS DEV MODE");
    await installExtension(REACT_DEVELOPER_TOOLS);
    await installExtension(REDUX_DEVTOOLS);
    // splashWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  splashWindow.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    splashWindow = null;
  });
};

const createWindow = async projectPath => {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800
  });

  const electronScreen = electron.screen;
  const mainScreen = electronScreen.getPrimaryDisplay();
  const dimensions = mainScreen.size;

  // Create the browser window.
  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    titleBarStyle: "hiddenInset",
    fullscreenable: false,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
      devTools: isDevMode
    }
  });

  mainWindowState.manage(mainWindow);

  // and load the index.html of the app.
  mainWindow.loadURL(
    `file://${__dirname}/windows/project.html?path=${encodeURIComponent(
      projectPath
    )}`
  );

  mainWindow.setRepresentedFilename(projectPath);

  // Open the DevTools.
  if (isDevMode) {
    console.log("IS DEV MODE");
    await installExtension(REACT_DEVELOPER_TOOLS);
    await installExtension(REDUX_DEVTOOLS);
    // mainWindow.webContents.openDevTools();
  }

  mainWindow.webContents.on("did-finish-load", function() {
    mainWindow.webContents.send("ping", "whoooooooh!");
    mainWindow.webContents.send("open-project", projectPath);
  });

  mainWindow.on("enter-full-screen", () => {
    console.log("FULL SCREEN");
    mainWindow.webContents.send("enter-full-screen");
  });

  mainWindow.on("leave-full-screen", () => {
    console.log("EXIT FULL SCREEN");
    mainWindow.webContents.send("leave-full-screen");
  });

  // Emitted when the window is closed.
  mainWindow.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

const createHelp = async helpPage => {
  if (!helpWindow) {
    // Create the browser window.
    helpWindow = new BrowserWindow({
      width: 430,
      height: 550,
      resizable: true,
      maximizable: true,
      fullscreenable: false,
      webPreferences: {
        nodeIntegration: false,
        devTools: isDevMode
      }
    });
  } else {
    helpWindow.show();
  }

  // and load the index.html of the app.
  helpWindow.loadURL(`file://${__dirname}/windows/help/${helpPage}.html`);

  // Open the DevTools.
  if (isDevMode) {
    console.log("IS DEV MODE");
    await installExtension(REACT_DEVELOPER_TOOLS);
    await installExtension(REDUX_DEVTOOLS);
    // helpWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  helpWindow.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    helpWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  // createSplash()
  createWindow(
    "/Users/chris/Library/Mobile Documents/com~apple~CloudDocs/GBJam/Untitled GB Game Test/project.json"
  );
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
  console.log(arg);

  // Validate folder
  const { projectPath } = arg;
  openProject(projectPath);

  // splashWindow.close();

  // console.log({ arg, projectPath });

  // await createWindow(projectPath);
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
  createHelp(helpPage);
});

ipcMain.on("document-modified", () => {
  console.log("WAS EDITIED");
  mainWindow.setDocumentEdited(true);
});

ipcMain.on("document-unmodified", () => {
  console.log("WAS NOT EDITIED");
  mainWindow.setDocumentEdited(false);
});

menu.on("new", async () => {
  newProject();
});

menu.on("open", async () => {
  console.log("MENU ON OPEN");
  openProjectPicker();
});

menu.on("save", async () => {
  console.log("MENU ON SAVE");
  mainWindow.webContents.send("save-project");
});

menu.on("undo", async () => {
  console.log("MENU ON UNDO");
  mainWindow.webContents.send("undo");
});

menu.on("redo", async () => {
  console.log("MENU ON REDO");
  mainWindow.webContents.send("redo");
});

menu.on("section", async section => {
  mainWindow.webContents.send("section", section);
});

const newProject = async () => {
  // console.log("New Project");
  if (splashWindow) {
    splashWindow.close();
  }
  if (mainWindow) {
    mainWindow.close();
  }
  await createSplash();
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
  console.log("openProject:" + projectPath);
  if (splashWindow) {
    splashWindow.close();
  }
  if (mainWindow) {
    mainWindow.close();
  }
  await createWindow(projectPath);
};

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
