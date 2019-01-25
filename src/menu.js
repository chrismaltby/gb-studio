const { app, Menu } = require("electron");

const template = [
  {
    label: "File",
    submenu: [
      {
        label: "New Project",
        accelerator: "CommandOrControl+N",
        click: () => console.log("NEW PROJECT")
      },
      {
        label: "Open...",
        accelerator: "CommandOrControl+O",
        click: () => console.log("OPEN PROJECT")
      },
      {
        label: "Save",
        accelerator: "CommandOrControl+S",
        click: () => console.log("SAVE")
      },
      { type: "separator" },
      { role: "close" }
    ]
  },
  {
    label: "Edit",
    submenu: [
      { role: "undo" },
      { role: "redo" },
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
      { label: "Overview", accelerator: "CommandOrControl+1" },
      { label: "Game World", accelerator: "CommandOrControl+2" },
      { label: "Sprites", accelerator: "CommandOrControl+3" },
      { label: "Backgrounds", accelerator: "CommandOrControl+4" },
      { label: "Tiles", accelerator: "CommandOrControl+5" },
      { label: "Script", accelerator: "CommandOrControl+6" },

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
