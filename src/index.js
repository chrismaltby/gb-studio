import electron, { app, BrowserWindow, ipcMain } from "electron";
import installExtension, {
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS
} from "electron-devtools-installer";
import { enableLiveReload } from "electron-compile";
import windowStateKeeper from "electron-window-state";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;
let splashWindow = null;

const isDevMode = process.execPath.match(/[\\/]electron/);

if (isDevMode) enableLiveReload({ strategy: "react-hmr" });

const createSplash = async () => {
  // Create the browser window.
  splashWindow = new BrowserWindow({
    width: 700,
    height: 432,
    resizable: false,
    maximizable: false,
    fullscreenable: false
  });

  // and load the index.html of the app.
  splashWindow.loadURL(`file://${__dirname}/splash.html`);

  // Open the DevTools.
  if (isDevMode) {
    console.log("IS DEV MODE");
    await installExtension(REACT_DEVELOPER_TOOLS);
    // installExtension(REDUX_DEVTOOLS)
    //   .then((name) => console.log(`Added Extension:  ${name}`))
    //   .catch((err) => console.log('An error occurred: ', err));
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
    titleBarStyle: "hiddenInset"
  });

  mainWindowState.manage(mainWindow);

  // and load the index.html of the app.
  mainWindow.loadURL(
    `file://${__dirname}/index.html?path=${encodeURIComponent(projectPath)}`
  );

  mainWindow.setRepresentedFilename(projectPath + "/project.json");
  mainWindow.setDocumentEdited(true);

  // Open the DevTools.
  if (isDevMode) {
    console.log("IS DEV MODE");
    await installExtension(REACT_DEVELOPER_TOOLS);
    // installExtension(REDUX_DEVTOOLS)
    //   .then((name) => console.log(`Added Extension:  ${name}`))
    //   .catch((err) => console.log('An error occurred: ', err));
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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  // createSplash()
  createWindow(
    "/Users/cmaltby/Library/Mobile Documents/com~apple~CloudDocs/GBJam/Untitled GB Game Test"
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

  splashWindow.close();

  console.log({ arg, projectPath });

  await createWindow(projectPath);
});

ipcMain.on("check-full-screen", async (event, arg) => {
  console.log("CHECK FULLSCREEN");
  if (mainWindow.isFullScreen()) {
    console.log("CHECK FULLSCREEN 1");
    mainWindow.webContents.send("enter-full-screen");
  } else {
    console.log("CHECK FULLSCREEN 2");
    mainWindow.webContents.send("leave-full-screen");
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
