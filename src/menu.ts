import openAboutWindow from "about-window";
import settings from "electron-settings";
import {
  app,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
  shell,
} from "electron";
import {
  assetsRoot,
  EMULATOR_MUTED_SETTING_KEY,
  LOCALE_SETTING_KEY,
  THEME_SETTING_KEY,
} from "./consts";
import l10n from "shared/lib/lang/l10n";
import { ThemeManager } from "lib/themes/themeManager";
import { L10nManager } from "lib/lang/l10nManager";

declare const COMMITHASH: string;

const isDevMode = process.execPath.match(/[\\/]electron/);

let menu: Menu;

type MenuListenerFn = (arg: unknown) => void;
type MenuListenerKey =
  | "new"
  | "open"
  | "project"
  | "save"
  | "saveAs"
  | "checkUpdates"
  | "undo"
  | "redo"
  | "section"
  | "zoom"
  | "reloadAssets"
  | "updateTheme"
  | "updateLocale"
  | "updateShowCollisions"
  | "updateShowConnections"
  | "updateShowNavigator"
  | "updateCheckSpelling"
  | "updateEmulatorMuted"
  | "run"
  | "build"
  | "ejectEngine"
  | "exportProjectSrc"
  | "exportProjectData"
  | "pasteInPlace"
  | "preferences"
  | "pluginManager"
  | "globalPlugins"
  | "projectPlugins"
  | "openMusic";

export type MenuZoomType = "in" | "out" | "reset";

const listeners: Record<MenuListenerKey, MenuListenerFn[]> = {
  new: [],
  open: [],
  project: [],
  save: [],
  saveAs: [],
  checkUpdates: [],
  undo: [],
  redo: [],
  section: [],
  zoom: [],
  reloadAssets: [],
  updateTheme: [],
  updateLocale: [],
  updateShowCollisions: [],
  updateShowConnections: [],
  updateShowNavigator: [],
  updateCheckSpelling: [],
  updateEmulatorMuted: [],
  run: [],
  build: [],
  ejectEngine: [],
  exportProjectSrc: [],
  exportProjectData: [],
  pasteInPlace: [],
  preferences: [],
  pluginManager: [],
  globalPlugins: [],
  projectPlugins: [],
  openMusic: [],
};

const notifyListeners = (event: MenuListenerKey, value?: unknown) => {
  for (const fn of listeners[event]) {
    fn(value);
  }
};

const on = (event: MenuListenerKey, fn: MenuListenerFn) => {
  listeners[event].push(fn);
};

const off = (event: MenuListenerKey, fn: MenuListenerFn) => {
  listeners[event] = listeners[event].filter((f) => f !== fn);
};

const openAbout = () => {
  return openAboutWindow({
    icon_path: `${assetsRoot}/app/icon/app_icon.png`,
    bug_link_text: `${l10n("FIELD_REPORT_BUG")} (git: ${COMMITHASH})`,
    // eslint-disable-next-line camelcase
    win_options: {
      title: l10n("MENU_ABOUT"),
    },
    description: l10n("GBSTUDIO_DESCRIPTION"),
    copyright: l10n("GBSTUDIO_COPYRIGHT"),
  });
};

interface BuildMenuProps {
  themeManager: ThemeManager;
  l10nManager: L10nManager;
}

const buildMenu = async ({ themeManager, l10nManager }: BuildMenuProps) => {
  const pluginThemes = themeManager.getPluginThemes();
  const pluginLangs = l10nManager.getPluginL10Ns();
  const systemLangs = l10nManager.getSystemL10Ns();

  const template: MenuItemConstructorOptions[] = [
    {
      label: l10n("MENU_FILE"),
      submenu: [
        {
          label: l10n("MENU_NEW_PROJECT"),
          accelerator: "CommandOrControl+N",
          click: () => {
            notifyListeners("new");
          },
        },
        {
          label: l10n("MENU_OPEN"),
          accelerator: "CommandOrControl+O",
          click: () => {
            notifyListeners("open");
          },
        },
        {
          label: l10n("MENU_SWITCH_PROJECT"),
          accelerator: "CommandOrControl+P",
          click: () => {
            notifyListeners("project");
          },
        },
        {
          label: l10n("MENU_SAVE"),
          accelerator: "CommandOrControl+S",
          click: () => {
            notifyListeners("save");
          },
        },
        {
          label: l10n("MENU_SAVE_AS"),
          accelerator: "CommandOrControl+Alt+S",
          click: () => {
            notifyListeners("saveAs");
          },
        },

        { type: "separator" },
        {
          label: l10n("MENU_RELOAD_ASSETS"),
          accelerator: "CommandOrControl+Shift+R",
          click: () => {
            notifyListeners("reloadAssets");
          },
        },
        { type: "separator" },
        { role: "close", label: l10n("MENU_CLOSE") },
      ],
    },
    {
      label: l10n("MENU_EDIT"),
      submenu: [
        {
          label: l10n("MENU_UNDO"),
          accelerator: "CommandOrControl+Z",
          click: () => {
            notifyListeners("undo");
          },
        },
        {
          label: l10n("MENU_REDO"),
          accelerator: "CommandOrControl+Shift+Z",
          click: () => {
            notifyListeners("redo");
          },
        },
        { type: "separator" },
        { role: "cut", label: l10n("MENU_CUT") },
        { role: "copy", label: l10n("MENU_COPY") },
        { role: "paste", label: l10n("MENU_PASTE") },
        {
          label: l10n("MENU_PASTE_IN_PLACE"),
          accelerator: "Shift+CommandOrControl+V",
          click: () => {
            notifyListeners("pasteInPlace");
          },
        },
        { role: "delete", label: l10n("MENU_DELETE") },
        { role: "selectAll", label: l10n("MENU_SELECT_ALL") },
        { type: "separator" },
        {
          label: l10n("MENU_SPELLING"),
          submenu: [
            {
              label: l10n("MENU_CHECK_SPELLING_WHILE_TYPING"),
              type: "checkbox",
              checked: settings.get("checkSpelling") !== false,
              click() {
                notifyListeners(
                  "updateCheckSpelling",
                  settings.get("checkSpelling") === false,
                );
              },
            },
          ],
        },
      ],
    },
    {
      label: l10n("MENU_GAME"),
      submenu: [
        {
          label: l10n("MENU_RUN"),
          accelerator: "CommandOrControl+B",
          click: () => {
            notifyListeners("run", false);
          },
        },
        {
          label: l10n("MENU_RUN_WITH_DEBUGGING"),
          accelerator: "CommandOrControl+Alt+B",
          click: () => {
            notifyListeners("run", true);
          },
        },
        {
          label: l10n("MENU_EXPORT_AS"),
          submenu: [
            {
              label: l10n("MENU_EXPORT_ROM"),
              accelerator: "CommandOrControl+Shift+B",
              click() {
                notifyListeners("build", "rom");
              },
            },
            {
              label: l10n("MENU_EXPORT_WEB"),
              accelerator: "CommandOrControl+Shift+N",
              click() {
                notifyListeners("build", "web");
              },
            },
            {
              label: l10n("MENU_EXPORT_POCKET"),
              accelerator: "CommandOrControl+Shift+M",
              click() {
                notifyListeners("build", "pocket");
              },
            },
          ],
        },
        { type: "separator" },
        {
          label: l10n("MENU_ADVANCED"),
          submenu: [
            {
              label: l10n("MENU_EJECT_ENGINE"),
              click() {
                notifyListeners("ejectEngine");
              },
            },
            { type: "separator" },
            {
              label: l10n("MENU_EJECT_PROJECT_BUILD"),
              click() {
                notifyListeners("exportProjectSrc");
              },
            },
            {
              label: l10n("MENU_EJECT_PROJECT_DATA"),
              click() {
                notifyListeners("exportProjectData");
              },
            },
          ],
        },
      ],
    },
    {
      label: l10n("MENU_PLUGINS"),
      submenu: [
        {
          label: l10n("MENU_PLUGIN_MANAGER"),
          click: () => {
            notifyListeners("pluginManager");
          },
        },
        { type: "separator" },
        {
          label: l10n("MENU_GLOBAL_PLUGINS"),
          click: () => {
            notifyListeners("globalPlugins");
          },
        },
        {
          label: l10n("MENU_PROJECT_PLUGINS"),
          click: () => {
            notifyListeners("projectPlugins");
          },
        },
      ],
    },
    {
      label: l10n("MENU_VIEW"),
      submenu: [
        {
          label: l10n("MENU_GAME_WORLD"),
          accelerator: "CommandOrControl+1",
          click: () => {
            notifyListeners("section", "world");
          },
        },
        {
          label: l10n("MENU_SPRITES"),
          accelerator: "CommandOrControl+2",
          click: () => {
            notifyListeners("section", "sprites");
          },
        },
        {
          label: l10n("MENU_IMAGES"),
          accelerator: "CommandOrControl+3",
          click: () => {
            notifyListeners("section", "backgrounds");
          },
        },
        {
          label: l10n("MENU_MUSIC"),
          accelerator: "CommandOrControl+4",
          click: () => {
            notifyListeners("section", "music");
          },
        },
        {
          label: l10n("MENU_SFX"),
          accelerator: "CommandOrControl+5",
          click: () => {
            notifyListeners("section", "sounds");
          },
        },
        {
          label: l10n("MENU_PALETTES"),
          accelerator: "CommandOrControl+6",
          click: () => {
            notifyListeners("section", "palettes");
          },
        },
        {
          label: l10n("MENU_DIALOGUE_REVIEW"),
          accelerator: "CommandOrControl+7",
          click: () => {
            notifyListeners("section", "dialogue");
          },
        },
        {
          label: l10n("MENU_SETTINGS"),
          accelerator: "CommandOrControl+8",
          click: () => {
            notifyListeners("section", "settings");
          },
        },
        { type: "separator" },
        {
          label: l10n("MENU_THEME"),
          submenu: [
            {
              id: "themeDefault",
              label: l10n("MENU_THEME_DEFAULT"),
              type: "checkbox",
              checked: settings.get(THEME_SETTING_KEY) === undefined,
              click() {
                notifyListeners("updateTheme", undefined);
              },
            },
            { type: "separator" },
            {
              id: "themeLight",
              label: l10n("MENU_THEME_LIGHT"),
              type: "checkbox",
              checked: settings.get(THEME_SETTING_KEY) === "light",
              click() {
                notifyListeners("updateTheme", "light");
              },
            },
            {
              id: "themeDark",
              label: l10n("MENU_THEME_DARK"),
              type: "checkbox",
              checked: settings.get(THEME_SETTING_KEY) === "dark",
              click() {
                notifyListeners("updateTheme", "dark");
              },
            },
            ...(pluginThemes.length > 0
              ? ([{ type: "separator" }] as MenuItemConstructorOptions[])
              : []),
            ...pluginThemes.map(
              (theme): MenuItemConstructorOptions => ({
                id: `theme-${theme.id}`,
                label: theme.name,
                type: "checkbox",
                checked: settings.get(THEME_SETTING_KEY) === theme.id,
                click() {
                  notifyListeners("updateTheme", theme.id);
                },
              }),
            ),
          ],
        },
        {
          label: l10n("MENU_LANGUAGE"),
          submenu: ([] as MenuItemConstructorOptions[]).concat(
            [
              {
                id: "localeDefault",
                label: l10n("MENU_LANGUAGE_DEFAULT"),
                type: "checkbox",
                checked: settings.get(LOCALE_SETTING_KEY) === undefined,
                click() {
                  notifyListeners("updateLocale", undefined);
                },
              },
              { type: "separator" },
            ],
            systemLangs.map((language) => {
              return {
                id: `locale-${language.id}`,
                label: language.name,
                type: "checkbox",
                checked: settings.get(LOCALE_SETTING_KEY) === language.id,
                click() {
                  notifyListeners("updateLocale", language.id);
                },
              };
            }),
            ...(pluginLangs.length > 0
              ? ([{ type: "separator" }] as MenuItemConstructorOptions[])
              : []),
            ...pluginLangs.map(
              (language): MenuItemConstructorOptions => ({
                id: `locale-${language.id}`,
                label: language.name,
                type: "checkbox",
                checked: settings.get(LOCALE_SETTING_KEY) === language.id,
                click() {
                  notifyListeners("updateLocale", language.id);
                },
              }),
            ),
          ),
        },
        { type: "separator" },
        {
          id: "showCollisions",
          label: l10n("MENU_SHOW_COLLISIONS"),
          type: "checkbox",
          checked: true,
          click: (item: MenuItem) => {
            notifyListeners("updateShowCollisions", item.checked);
          },
        },
        {
          label: l10n("MENU_SHOW_CONNECTIONS"),
          submenu: [
            {
              id: "showConnectionsAll",
              label: l10n("MENU_SHOW_CONNECTIONS_ALL"),
              type: "checkbox",
              checked: settings.get("showConnections") === "all",
              click() {
                notifyListeners("updateShowConnections", "all");
              },
            },
            {
              id: "showConnectionsSelected",
              label: l10n("MENU_SHOW_CONNECTIONS_SELECTED"),
              type: "checkbox",
              checked:
                settings.get("showConnections") === "selected" ||
                settings.get("showConnections") === true,
              click() {
                notifyListeners("updateShowConnections", "selected");
              },
            },
            { type: "separator" },
            {
              id: "showConnectionsNone",
              label: l10n("MENU_SHOW_CONNECTIONS_NONE"),
              type: "checkbox",
              checked: settings.get("showConnections") === false,
              click() {
                notifyListeners("updateShowConnections", false);
              },
            },
          ],
        },
        {
          id: "showNavigator",
          label: l10n("MENU_SHOW_NAVIGATOR"),
          checked: settings.get("showNavigator") !== false,
          type: "checkbox",
          click: (item: MenuItem) => {
            notifyListeners("updateShowNavigator", item.checked);
          },
        },
        { type: "separator" },
        {
          label: l10n("MENU_ZOOM_RESET"),
          accelerator: "CommandOrControl+0",
          click: () => {
            notifyListeners("zoom", "reset");
          },
        },
        {
          label: l10n("MENU_ZOOM_IN"),
          accelerator: "CommandOrControl+=",
          click: () => {
            notifyListeners("zoom", "in");
          },
        },
        {
          label: l10n("MENU_ZOOM_OUT"),
          accelerator: "CommandOrControl+-",
          click: () => {
            notifyListeners("zoom", "out");
          },
        },
      ],
    },
    {
      role: "window",
      label: l10n("MENU_WINDOW"),
      submenu: [
        {
          label: l10n("MENU_PLAY_WINDOW"),
          submenu: [
            {
              label: l10n("MENU_MUTE_AUDIO"),
              type: "checkbox",
              checked: settings.get(EMULATOR_MUTED_SETTING_KEY) === true,
              click: (item: MenuItem) => {
                notifyListeners("updateEmulatorMuted", item.checked);
              },
            },
          ],
        },
        { type: "separator" },
        {
          label: l10n("MENU_MINIMIZE"),
          role: "minimize",
        },
      ],
    },
    {
      role: "help",
      label: l10n("MENU_HELP"),
      submenu: [
        {
          label: l10n("MENU_DOCUMENTATION"),
          click() {
            shell.openExternal("https://www.gbstudio.dev/docs/");
          },
        },
        {
          label: l10n("MENU_LEARN_MORE"),
          click() {
            shell.openExternal("https://www.gbstudio.dev");
          },
        },
      ],
    },
  ];

  if (isDevMode) {
    const submenu = template[template.length - 3].submenu || [];
    if ("push" in submenu) {
      submenu.push({ type: "separator" });
      submenu.push({
        label: "Debug",
        submenu: [
          { role: "reload" },
          { role: "forceReload" },
          { role: "toggleDevTools" },
          {
            label: l10n("MENU_OPEN_MUSIC_PROCESS_WINDOW"),
            click: () => {
              notifyListeners("openMusic");
            },
          },
        ],
      });
    }
  }

  if (process.platform === "darwin") {
    template.unshift({
      label: app.name,
      submenu: [
        {
          label: l10n("MENU_ABOUT"),
          click() {
            openAbout();
          },
        },
        {
          label: l10n("MENU_CHECK_FOR_UPDATES"),
          click: () => {
            notifyListeners("checkUpdates");
          },
        },
        { type: "separator" },
        {
          label: l10n("MENU_PREFERENCES"),
          accelerator: "CommandOrControl+,",
          click: () => {
            notifyListeners("preferences");
          },
        },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    });

    // Edit menu
    const editSubmenu = template[2].submenu;
    if (editSubmenu && "push" in editSubmenu) {
      editSubmenu.push(
        { type: "separator" },
        {
          label: l10n("MENU_SPEECH"),
          submenu: [{ role: "startSpeaking" }, { role: "stopSpeaking" }],
        },
      );
    }

    // Window menu
    template[template.length - 2].submenu = [
      {
        label: l10n("MENU_PLAY_WINDOW"),
        submenu: [
          {
            label: l10n("MENU_MUTE_AUDIO"),
            type: "checkbox",
            checked: settings.get(EMULATOR_MUTED_SETTING_KEY) === true,
            click: (item: MenuItem) => {
              notifyListeners("updateEmulatorMuted", item.checked);
            },
          },
        ],
      },
      { type: "separator" },
      { label: l10n("MENU_MINIMIZE"), role: "minimize" },
      { role: "zoom" },
      { type: "separator" },
      { role: "front" },
    ];
  } else {
    // About menu item for Windows / Linux
    const aboutSubmenu = template[template.length - 1].submenu;
    if (aboutSubmenu && "push" in aboutSubmenu) {
      aboutSubmenu.push(
        { type: "separator" },
        {
          label: l10n("MENU_ABOUT"),
          click() {
            openAbout();
          },
        },
        {
          label: l10n("MENU_CHECK_FOR_UPDATES"),
          click: () => {
            notifyListeners("checkUpdates");
          },
        },
      );
    }

    // Edit Preferences for Windows / Linux
    const editSubmenu = template[1].submenu;
    if (editSubmenu && "push" in editSubmenu) {
      editSubmenu.push(
        { type: "separator" },
        {
          label: l10n("MENU_PREFERENCES"),
          accelerator: "CommandOrControl+,",
          click: () => {
            notifyListeners("preferences");
          },
        },
      );
    }
  }

  menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

const appMenu = {
  on,
  off,
  ref: () => menu,
  buildMenu,
};

export const setMenuItemChecked = (id: string, checkedValue: boolean) => {
  if (!menu) {
    return;
  }
  const menuItem = menu.getMenuItemById(id);
  if (!menuItem) {
    return;
  }
  menuItem.checked = checkedValue;
};

export default appMenu;
