const { app, Menu } = require("electron");

const template = [
  {
    label: "File",
    submenu: [
      {
        label: "New Project",
        accelerator: "CommandOrControl+N",
        click: () => {
          console.log("NEW PROJECT");
          notifyListeners("new");
        }
      },
      {
        label: "Open...",
        accelerator: "CommandOrControl+O",
        click: () => {
          console.log("OPEN PROJECT");
          notifyListeners("open");
        }
      },
      {
        label: "Save",
        accelerator: "CommandOrControl+S",
        click: () => {
          console.log("SAVE");
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
        label: 'Undo',
        accelerator: 'CommandOrControl+Z',
        click: () => {
          console.log("UNDO1");
          notifyListeners("undo");
        }
      },
      {
        label: 'Redo',
        accelerator: 'CommandOrControl+Shift+Z', click: () => {
          console.log("REDO1");
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
    label: "View",
    submenu: [
      {
        label: "Overview", accelerator: "CommandOrControl+1", click: () => {
          notifyListeners("section", "overview");
        }
      },
      {
        label: "Game World", accelerator: "CommandOrControl+2", click: () => {
          notifyListeners("section", "world");
        }
      },
      {
        label: "Sprites", accelerator: "CommandOrControl+3", click: () => {
          notifyListeners("section", "sprites");
        }
      },
      {
        label: "Backgrounds", accelerator: "CommandOrControl+4", click: () => {
          notifyListeners("section", "backgrounds");
        }
      },
      {
        label: "Script Review", accelerator: "CommandOrControl+5", click: () => {
          notifyListeners("section", "script");
        }
      },
      {
        label: "Build && Run", accelerator: "CommandOrControl+6", click: () => {
          notifyListeners("section", "build");
        }
      },

      { type: "separator" },
      {
        label: "Debug",
        submenu: [
          { role: "reload" },
          { role: "forcereload" },
          { role: "toggledevtools" }
        ]
      },
      { type: "separator" },

      { role: "togglefullscreen" }
    ]
  },
  {
    role: "window",
    submenu: [
      { role: "minimize" },
      { role: "resetzoom" },
      { role: "zoomin" },
      { role: "zoomout" }
    ]
  },
  {
    role: "help",
    submenu: [
      {
        label: "Learn More",
        click() {
          require("electron").shell.openExternal("https://electronjs.org");
        }
      }
    ]
  }
];

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
  template[4].submenu = [
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
  section: []
};

const notifyListeners = (event, data) => {
  console.log("MENU NOTIFY", event, data);
  for (let fn of listeners[event]) {
    console.log("FOUND LISTENER TO NOTIFY", fn);
    fn(data);
  }
};

const on = (event, fn) => {
  console.log("MENU LISTEN ON", event, fn);
  listeners[event].push(fn);
};

const off = (event, fn) => {
  listeners[event] = listeners[event].filter(f => f !== fn);
};

export default {
  on,
  off
};
