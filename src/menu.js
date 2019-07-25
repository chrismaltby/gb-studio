import openAboutWindow from "about-window";
import settings from "electron-settings";
import { app, Menu, shell } from "electron";

const isDevMode = process.execPath.match(/[\\/]electron/);

let menu;

const buildMenu = async (plugins = []) => {
  // L10N requires app ready to get locale
  // eslint-disable-next-line global-require
  const l10n = require("./lib/helpers/l10n").default;

  const template = [
    {
      label: l10n("MENU_FILE"),
      submenu: [
        {
          label: l10n("MENU_NEW_PROJECT"),
          accelerator: "CommandOrControl+N",
          click: () => {
            notifyListeners("new");
          }
        },
        {
          label: l10n("MENU_OPEN"),
          accelerator: "CommandOrControl+O",
          click: () => {
            notifyListeners("open");
          }
        },
        {
          label: l10n("MENU_SAVE"),
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
      label: l10n("MENU_EDIT"),
      submenu: [
        {
          label: l10n("MENU_UNDO"),
          accelerator: "CommandOrControl+Z",
          click: () => {
            notifyListeners("undo");
          }
        },
        {
          label: l10n("MENU_REDO"),
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
      label: l10n("MENU_GAME"),
      submenu: [
        {
          label: l10n("MENU_RUN"),
          accelerator: "CommandOrControl+B",
          click: () => {
            notifyListeners("run");
          }
        },
        {
          label: l10n("MENU_EXPORT_AS"),
          submenu: [
            {
              label: l10n("MENU_EXPORT_ROM"),
              accelerator: "CommandOrControl+Shift+B",
              click() {
                notifyListeners("build", "rom");
              }
            },
            {
              label: l10n("MENU_EXPORT_WEB"),
              accelerator: "CommandOrControl+Shift+N",
              click() {
                notifyListeners("build", "web");
              }
            }
          ]
        },
        { type: "separator" },
        {
          label: l10n("MENU_CART_TYPE"),
          submenu: [
            {
              id: "cart1B",
              label: "MBC5+RAM+BATTERY",
              type: "radio",
              checked: true,
              click() {
                notifyListeners("updateSetting", "cartType", "1B");
              }
            },
            {
              id: "cart03",
              label: "MBC1+RAM+BATTERY",
              type: "radio",
              checked: false,
              click() {
                notifyListeners("updateSetting", "cartType", "03");
              }
            },
            {
              id: "cart1A",
              label: "MBC5+RAM",
              type: "radio",
              checked: false,
              click() {
                notifyListeners("updateSetting", "cartType", "1A");
              }
            },
            {
              id: "cart02",
              label: "MBC1+RAM",
              type: "radio",
              checked: false,
              click() {
                notifyListeners("updateSetting", "cartType", "02");
              }
            }
          ]
        }
      ]
    },
    {
      label: l10n("MENU_VIEW"),
      submenu: [
        {
          label: l10n("MENU_GAME_WORLD"),
          accelerator: "CommandOrControl+1",
          click: () => {
            notifyListeners("section", "world");
          }
        },
        {
          label: l10n("MENU_SPRITES"),
          accelerator: "CommandOrControl+2",
          click: () => {
            notifyListeners("section", "sprites");
          }
        },
        {
          label: l10n("MENU_BACKGROUNDS"),
          accelerator: "CommandOrControl+3",
          click: () => {
            notifyListeners("section", "backgrounds");
          }
        },
        {
          label: l10n("MENU_UI_ELEMENTS"),
          accelerator: "CommandOrControl+4",
          click: () => {
            notifyListeners("section", "ui");
          }
        },
        {
          label: l10n("MENU_MUSIC"),
          accelerator: "CommandOrControl+5",
          click: () => {
            notifyListeners("section", "music");
          }
        },
        {
          label: l10n("MENU_DIALOGUE_REVIEW"),
          accelerator: "CommandOrControl+6",
          click: () => {
            notifyListeners("section", "dialogue");
          }
        },
        {
          label: l10n("MENU_BUILD_AND_RUN"),
          accelerator: "CommandOrControl+7",
          click: () => {
            notifyListeners("section", "build");
          }
        },
        {
          label: l10n("MENU_SETTINGS"),
          accelerator: "CommandOrControl+8",
          click: () => {
            notifyListeners("section", "settings");
          }
        },
        { type: "separator" },
        {
          label: l10n("MENU_THEME"),
          submenu: [
            {
              id: "themeDefault",
              label: l10n("MENU_THEME_DEFAULT"),
              type: "checkbox",
              checked: settings.get("theme") === undefined,
              click() {
                notifyListeners("updateSetting", "theme", undefined);
              }
            },
            { type: "separator" },
            {
              id: "themeLight",
              label: l10n("MENU_THEME_LIGHT"),
              type: "checkbox",
              checked: settings.get("theme") === "light",
              click() {
                notifyListeners("updateSetting", "theme", "light");
              }
            },
            {
              id: "themeDark",
              label: l10n("MENU_THEME_DARK"),
              type: "checkbox",
              checked: settings.get("theme") === "dark",
              click() {
                notifyListeners("updateSetting", "theme", "dark");
              }
            }
          ]
        },
        { type: "separator" },
        {
          id: "showCollisions",
          label: l10n("MENU_SHOW_COLLISIONS"),
          type: "checkbox",
          checked: true,
          click: item => {
            notifyListeners("updateSetting", "showCollisions", item.checked);
          }
        },
        {
          id: "showConnections",
          label: l10n("MENU_SHOW_CONNECTIONS"),
          type: "checkbox",
          checked: true,
          click: item => {
            notifyListeners("updateSetting", "showConnections", item.checked);
          }
        },
        { type: "separator" },
        {
          label: l10n("MENU_ZOOM_RESET"),
          accelerator: "CommandOrControl+0",
          click: () => {
            notifyListeners("zoom", "reset");
          }
        },
        {
          label: l10n("MENU_ZOOM_IN"),
          accelerator: "CommandOrControl+=",
          click: () => {
            notifyListeners("zoom", "in");
          }
        },
        {
          label: l10n("MENU_ZOOM_OUT"),
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
          label: l10n("MENU_DOCUMENTATION"),
          click() {
            shell.openExternal("https://www.gbstudio.dev/docs/");
          }
        },
        {
          label: l10n("MENU_LEARN_MORE"),
          click() {
            shell.openExternal("https://www.gbstudio.dev");
          }
        }
      ]
    }
  ];

  if (plugins && plugins.length > 0) {
    template.splice(3, 0, {
      id: "plugins",
      label: l10n("MENU_PLUGINS"),
      submenu: plugins
    });
  }

  if (isDevMode) {
    template[template.length - 3].submenu.push({ type: "separator" });
    template[template.length - 3].submenu.push({
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
          label: l10n("MENU_ABOUT"),
          click() {
            openAbout();
          }
        },
        { type: "separator" },
        {
          label: l10n("MENU_CHECK_FOR_UPDATES"),
          click: () => {
            notifyListeners("checkUpdates");
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
        label: l10n("MENU_SPEECH"),
        submenu: [{ role: "startspeaking" }, { role: "stopspeaking" }]
      }
    );

    // Window menu
    template[template.length - 2].submenu = [
      { role: "minimize" },
      { role: "zoom" },
      { type: "separator" },
      { role: "front" }
    ];
  } else {
    // About menu item for Windows / Linux
    template[template.length - 1].submenu.push(
      { type: "separator" },
      {
        label: l10n("MENU_ABOUT"),
        click() {
          openAbout();
        }
      },
      {
        label: l10n("MENU_CHECK_FOR_UPDATES"),
        click: () => {
          notifyListeners("checkUpdates");
        }
      }
    );
  }

  menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

app.on("ready", () => buildMenu([]));

const listeners = {
  new: [],
  open: [],
  save: [],
  checkUpdates: [],
  undo: [],
  redo: [],
  section: [],
  zoom: [],
  updateSetting: [],
  run: [],
  build: []
};

const notifyListeners = (event, ...data) => {
  for (const fn of listeners[event]) {
    fn(...data);
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
    icon_path: "../../src/assets/app/icon/app_icon.png"
  });
};

export default {
  on,
  off,
  ref: () => menu,
  buildMenu: plugins => {
    buildMenu(plugins);
  }
};
