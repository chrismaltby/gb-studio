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
        label: "Build As",
        submenu: [
          {
            label: "Rom",
            accelerator: "CommandOrControl+Shift+B",
            click() {
              notifyListeners("build", "rom");
            }
          },
          {
            label: "Web",
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
        label: "Overview",
        accelerator: "CommandOrControl+1",
        click: () => {
          notifyListeners("section", "overview");
        }
      },
      {
        label: "Game World",
        accelerator: "CommandOrControl+2",
        click: () => {
          notifyListeners("section", "world");
        }
      },
      {
        label: "Sprites",
        accelerator: "CommandOrControl+3",
        click: () => {
          notifyListeners("section", "sprites");
        }
      },
      {
        label: "Backgrounds",
        accelerator: "CommandOrControl+4",
        click: () => {
          notifyListeners("section", "backgrounds");
        }
      },
      {
        label: "UI Elements",
        accelerator: "CommandOrControl+5",
        click: () => {
          notifyListeners("section", "ui");
        }
      },
      {
        label: "Music",
        accelerator: "CommandOrControl+6",
        click: () => {
          notifyListeners("section", "music");
        }
      },
      {
        label: "Script Review",
        accelerator: "CommandOrControl+7",
        click: () => {
          notifyListeners("section", "script");
        }
      },
      {
        label: "Build && Run",
        accelerator: "CommandOrControl+8",
        click: () => {
          notifyListeners("section", "build");
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
        label: "Learn More",
        click() {
          require("electron").shell.openExternal("https://gbstudio.dev");
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
      { role: "about" },
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
  run: [],
  build: []
};

const notifyListeners = (event, data) => {
  for (let fn of listeners[event]) {
    fn(data);
  }
};

const on = (event, fn) => {
  listeners[event].push(fn);
};

const off = (event, fn) => {
  listeners[event] = listeners[event].filter(f => f !== fn);
};

export default {
  on,
  off
};
