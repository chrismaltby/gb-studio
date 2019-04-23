import openAboutWindow from "about-window";
const { app, Menu } = require("electron");

const isDevMode = process.execPath.match(/[\\/]electron/);

const template = [
  {
    label: "File",
    submenu: [
      {
        label: "New Project",
        accelerator: "CommandOrControl+N",
        click: () => {
          notifyListeners("new");
        }
      },
      {
        label: "Open...",
        accelerator: "CommandOrControl+O",
        click: () => {
          notifyListeners("open");
        }
      },
      {
        label: "Save",
        accelerator: "CommandOrControl+S",
        click: () => {
          notifyListeners("save");
        }
      },
      { type: "separator" },
      { role: "close" }
    ]
  },
  {
    label: "Edit",
    submenu: [
      {
        label: "Undo",
        accelerator: "CommandOrControl+Z",
        click: () => {
          notifyListeners("undo");
        }
      },
      {
        label: "Redo",
        accelerator: "CommandOrControl+Shift+Z",
        click: () => {
          notifyListeners("redo");
        }
      },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      { role: "pasteandmatchstyle" },
      { role: "delete" },
      { role: "selectall" }
    ]
  },
  {
    label: "Game",
    submenu: [
      {
        label: "Run",
        accelerator: "CommandOrControl+B",
        click: () => {
          notifyListeners("run");
        }
      },
      {
        label: "Export As",
        submenu: [
          {
            label: "Export Rom",
            accelerator: "CommandOrControl+Shift+B",
            click() {
              notifyListeners("build", "rom");
            }
          },
          {
            label: "Export Web",
            accelerator: "CommandOrControl+Shift+N",
            click() {
              notifyListeners("build", "web");
            }
          }
        ]
      }
    ]
  },
  {
    label: "View",
    submenu: [
      {
        label: "Game World",
        accelerator: "CommandOrControl+1",
        click: () => {
          notifyListeners("section", "world");
        }
      },
      {
        label: "Sprites",
        accelerator: "CommandOrControl+2",
        click: () => {
          notifyListeners("section", "sprites");
        }
      },
      {
        label: "Backgrounds",
        accelerator: "CommandOrControl+3",
        click: () => {
          notifyListeners("section", "backgrounds");
        }
      },
      {
        label: "UI Elements",
        accelerator: "CommandOrControl+4",
        click: () => {
          notifyListeners("section", "ui");
        }
      },
      {
        label: "Music",
        accelerator: "CommandOrControl+5",
        click: () => {
          notifyListeners("section", "music");
        }
      },
      {
        label: "Script Review",
        accelerator: "CommandOrControl+6",
        click: () => {
          notifyListeners("section", "script");
        }
      },
      {
        label: "Build && Run",
        accelerator: "CommandOrControl+7",
        click: () => {
          notifyListeners("section", "build");
        }
      },
      { type: "separator" },
      {
        id: "showCollisions",
        label: "Show Collisions",
        type: "checkbox",
        checked: true,
        click: item => {
          notifyListeners("updateSetting", "showCollisions", item.checked);
        }
      },
      {
        id: "showConnections",
        label: "Show Connections",
        type: "checkbox",
        checked: true,
        click: item => {
          notifyListeners("updateSetting", "showConnections", item.checked);
        }
      },
      { type: "separator" },
      {
        label: "Actual Size",
        accelerator: "CommandOrControl+0",
        click: () => {
          notifyListeners("zoom", "reset");
        }
      },
      {
        label: "Zoom In",
        accelerator: "CommandOrControl+=",
        click: () => {
          notifyListeners("zoom", "in");
        }
      },
      {
        label: "Zoom Out",
        accelerator: "CommandOrControl+-",
        click: () => {
          notifyListeners("zoom", "out");
        }
      }
    ]
  },
  {
    role: "window",
    submenu: [{ role: "minimize" }]
  },
  {
    role: "help",
    submenu: [
      {
        label: "Documentation",
        click() {
          require("electron").shell.openExternal(
            "https://www.gbstudio.dev/docs/"
          );
        }
      },
      {
        label: "Learn More",
        click() {
          require("electron").shell.openExternal("https://www.gbstudio.dev");
        }
      }
    ]
  }
];

if (isDevMode) {
  template[3].submenu.push({ type: "separator" });
  template[3].submenu.push({
    label: "Debug",
    submenu: [
      { role: "reload" },
      { role: "forcereload" },
      { role: "toggledevtools" }
    ]
  });
}

if (process.platform === "darwin") {
  template.unshift({
    label: app.getName(),
    submenu: [
      {
        label: "About GB Studio",
        click() {
          openAbout();
        }
      },
      { type: "separator" },
      { role: "services" },
      { type: "separator" },
      { role: "hide" },
      { role: "hideothers" },
      { role: "unhide" },
      { type: "separator" },
      { role: "quit" }
    ]
  });

  // Edit menu
  template[2].submenu.push(
    { type: "separator" },
    {
      label: "Speech",
      submenu: [{ role: "startspeaking" }, { role: "stopspeaking" }]
    }
  );

  // Window menu
  template[5].submenu = [
    { role: "minimize" },
    { role: "zoom" },
    { type: "separator" },
    { role: "front" }
  ];
} else {
  // About menu item for Windows / Linux
  template[5].submenu.push(
    { type: "separator" },
    {
      label: "About GB Studio",
      click() {
        openAbout();
      }
    }
  );
}

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

let listeners = {
  new: [],
  open: [],
  save: [],
  undo: [],
  redo: [],
  section: [],
  zoom: [],
  updateSetting: [],
  run: [],
  build: []
};

const notifyListeners = (event, ...data) => {
  for (let fn of listeners[event]) {
    fn.apply(null, data);
  }
};

const on = (event, fn) => {
  listeners[event].push(fn);
};

const off = (event, fn) => {
  listeners[event] = listeners[event].filter(f => f !== fn);
};

const openAbout = () => {
  return openAboutWindow({
    icon_path: "../../src/images/app/icon/app_icon.png"
  });
};

export default {
  on,
  off,
  ref: menu
};
