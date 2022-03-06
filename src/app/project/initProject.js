import Path from "path";
import { ActionCreators } from "redux-undo";
import { ipcRenderer, webFrame } from "electron";
import settings from "electron-settings";
import debounce from "lodash/debounce";
import mapValues from "lodash/mapValues";
import store from "store/configureStore";
import watchProject from "lib/project/watchProject";
import plugins, { initPlugins } from "lib/plugins/plugins";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import settingsActions from "store/features/settings/settingsActions";
import navigationActions from "store/features/navigation/navigationActions";
import projectActions from "store/features/project/projectActions";
import buildGameActions from "store/features/buildGame/buildGameActions";
import clipboardActions from "store/features/clipboard/clipboardActions";
import engineActions from "store/features/engine/engineActions";
import errorActions from "store/features/error/errorActions";
import initElectronL10n from "lib/helpers/initElectronL10n";
import { clampSidebarWidth } from "lib/helpers/window/sidebar";
import { initKeyBindings } from "lib/keybindings/keyBindings";

initElectronL10n();

const actions = {
  ...editorActions,
  ...entitiesActions,
  ...settingsActions,
  ...navigationActions,
  ...buildGameActions,
  ...clipboardActions,
};

const vmActions = mapValues(actions, (_fn, key) => {
  // Strip proxy object from VM2 output
  return (payload) => actions[key](JSON.parse(JSON.stringify(payload)));
});

const urlParams = new URLSearchParams(window.location.search);
const projectPath = urlParams.get("path");

if (projectPath) {
  const projectRoot = Path.dirname(projectPath);
  store.dispatch(projectActions.openProject(projectPath));
  store.dispatch(engineActions.scanEngine(projectPath));
  initPlugins(projectRoot);
}

initKeyBindings();

watchProject(projectPath, {
  onAddSprite: (f) => store.dispatch(projectActions.loadSprite(f)),
  onAddBackground: (f) => store.dispatch(projectActions.loadBackground(f)),
  onAddMusic: (f) => store.dispatch(projectActions.loadMusic(f)),
  onAddSound: (f) => store.dispatch(projectActions.loadSound(f)),
  onAddFont: (f) => store.dispatch(projectActions.loadFont(f)),
  onAddAvatar: (f) => store.dispatch(projectActions.loadAvatar(f)),
  onAddEmote: (f) => store.dispatch(projectActions.loadEmote(f)),
  onChangedSprite: (f) => store.dispatch(projectActions.loadSprite(f)),
  onChangedBackground: (f) => store.dispatch(projectActions.loadBackground(f)),
  onChangedMusic: (f) => store.dispatch(projectActions.loadMusic(f)),
  onChangedSound: (f) => store.dispatch(projectActions.loadSound(f)),
  onChangedFont: (f) => store.dispatch(projectActions.loadFont(f)),
  onChangedAvatar: (f) => store.dispatch(projectActions.loadAvatar(f)),
  onChangedEmote: (f) => store.dispatch(projectActions.loadEmote(f)),
  onRemoveSprite: (f) => store.dispatch(projectActions.removeSprite(f)),
  onRemoveBackground: (f) => store.dispatch(projectActions.removeBackground(f)),
  onRemoveMusic: (f) => store.dispatch(projectActions.removeMusic(f)),
  onRemoveSound: (f) => store.dispatch(projectActions.removeSound(f)),
  onRemoveFont: (f) => store.dispatch(projectActions.removeFont(f)),
  onRemoveAvatar: (f) => store.dispatch(projectActions.removeAvatar(f)),
  onRemoveEmote: (f) => store.dispatch(projectActions.removeEmote(f)),
  onChangedUI: (_f) => store.dispatch(projectActions.loadUI()),
  onChangedEngineSchema: (_f) =>
    store.dispatch(engineActions.scanEngine(projectPath)),
});

window.ActionCreators = ActionCreators;
window.store = store;
window.undo = () => {
  store.dispatch(ActionCreators.undo());
};

window.addEventListener("error", (error) => {
  if (error.message.indexOf("dead code elimination") > -1) {
    return true;
  }
  error.stopPropagation();
  error.preventDefault();
  // eslint-disable-next-line no-console
  console.error(error);
  store.dispatch(
    errorActions.setGlobalError({
      message: error.message,
      filename: error.filename,
      line: error.lineno,
      col: error.colno,
      stackTrace: error.error.stack,
    })
  );
  return false;
});

const onSaveProject = () => {
  store.dispatch(projectActions.saveProject());
};

const onSaveAndCloseProject = async () => {
  await store.dispatch(projectActions.saveProject());
  window.close();
};

const onSaveProjectAs = (event, pathName) => {
  store.dispatch(projectActions.saveProject(pathName));
};

const onUndo = () => {
  store.dispatch(ActionCreators.undo());
};

const onRedo = () => {
  store.dispatch(ActionCreators.redo());
};

const onSetSection = (event, section) => {
  store.dispatch(navigationActions.setSection(section));
};

const onReloadAssets = () => {
  store.dispatch(projectActions.reloadAssets());
};

const onUpdateSetting = (event, setting, value) => {
  store.dispatch(
    settingsActions.editSettings({
      [setting]: value,
    })
  );
};

const onZoom = (event, zoomType) => {
  const state = store.getState();
  if (zoomType === "in") {
    store.dispatch(editorActions.zoomIn({ section: state.navigation.section }));
  } else if (zoomType === "out") {
    store.dispatch(
      editorActions.zoomOut({ section: state.navigation.section })
    );
  } else {
    store.dispatch(
      editorActions.zoomReset({ section: state.navigation.section })
    );
  }
};

const onWindowZoom = (event, zoomLevel) => {
  webFrame.setZoomLevel(zoomLevel);
};

const onRun = () => {
  store.dispatch(buildGameActions.buildGame());
};

const onBuild = (event, buildType, eject) => {
  store.dispatch(
    buildGameActions.buildGame({
      buildType,
      exportBuild: !eject,
      ejectBuild: eject,
    })
  );
};

const onEjectEngine = () => {
  store.dispatch(buildGameActions.ejectEngine());
};

const onExportProject = (_event, exportType) => {
  store.dispatch(buildGameActions.exportProject(exportType));
};

const onPluginRun = (_event, pluginId) => {
  if (plugins.menu[pluginId] && plugins.menu[pluginId].run) {
    plugins.menu[pluginId].run(store, vmActions);
  }
};

const onPasteInPlace = (_event) => {
  store.dispatch(clipboardActions.pasteClipboardEntityInPlace());
};

const onKeyBindingsUpdate = (_event) => {
  initKeyBindings();
};

ipcRenderer.on("save-project", onSaveProject);
ipcRenderer.on("save-project-and-close", onSaveAndCloseProject);
ipcRenderer.on("save-as-project", onSaveProjectAs);
ipcRenderer.on("undo", onUndo);
ipcRenderer.on("redo", onRedo);
ipcRenderer.on("section", onSetSection);
ipcRenderer.on("reloadAssets", onReloadAssets);
ipcRenderer.on("updateSetting", onUpdateSetting);
ipcRenderer.on("zoom", onZoom);
ipcRenderer.on("windowZoom", onWindowZoom);
ipcRenderer.on("run", onRun);
ipcRenderer.on("build", onBuild);
ipcRenderer.on("ejectEngine", onEjectEngine);
ipcRenderer.on("exportProject", onExportProject);
ipcRenderer.on("plugin-run", onPluginRun);
ipcRenderer.on("paste-in-place", onPasteInPlace);
ipcRenderer.on("keybindings-update", onKeyBindingsUpdate);

const worldSidebarWidth = settings.get("worldSidebarWidth");
const filesSidebarWidth = settings.get("filesSidebarWidth");
const navigatorSidebarWidth = settings.get("navigatorSidebarWidth");

if (worldSidebarWidth) {
  store.dispatch(
    editorActions.resizeWorldSidebar(clampSidebarWidth(worldSidebarWidth))
  );
}
if (filesSidebarWidth) {
  store.dispatch(
    editorActions.resizeFilesSidebar(clampSidebarWidth(filesSidebarWidth))
  );
}
if (navigatorSidebarWidth) {
  store.dispatch(editorActions.resizeNavigatorSidebar(navigatorSidebarWidth));
}

window.addEventListener(
  "resize",
  debounce(() => {
    const state = store.getState();
    store.dispatch(
      editorActions.resizeWorldSidebar(
        clampSidebarWidth(state.editor.worldSidebarWidth)
      )
    );
    store.dispatch(
      editorActions.resizeFilesSidebar(
        clampSidebarWidth(state.editor.filesSidebarWidth)
      )
    );
  }, 500)
);

// Overide Accelerator undo for windows, fixes chrome undo conflict
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyZ" && e.ctrlKey) {
    if (e.shiftKey) {
      e.preventDefault();
      onRedo();
    } else {
      e.preventDefault();
      onUndo();
    }
  }
});

// Prevent mousewheel from accidentally changing focused number fields
document.body.addEventListener("mousewheel", () => {
  if (document.activeElement.type === "number") {
    document.activeElement.blur();
  }
});

let modified = true;
store.subscribe(() => {
  const state = store.getState();
  if (!modified && state.document.modified) {
    ipcRenderer.send("document-modified", {});
  } else if (modified && !state.document.modified) {
    ipcRenderer.send("document-unmodified", {});
  }
  modified = state.document.modified;
});
