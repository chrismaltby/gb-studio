import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { ActionCreators } from "redux-undo";
import { ipcRenderer, clipboard } from "electron";
import settings from "electron-settings";
import debounce from "lodash/debounce";
import * as actions from "./actions";
import store from "./store/configureStore";
import watchProject from "./lib/project/watchProject";
import App from "./components/app/App";
import "./lib/electron/handleFullScreen";
import AppContainerDnD from "./components/app/AppContainerDnD";
import plugins from "./lib/plugins/plugins";
import "./lib/helpers/handleTheme";
import "./styles/App.css";
import { actions as editorActions } from "./store/features/editor/editorSlice";
import { actions as entityActions } from "./store/features/entities/entitiesSlice";
import { actions as settingsActions } from "./store/features/settings/settingsSlice";
import { actions as navigationActions } from "./store/features/navigation/navigationSlice";
import { actions as projectActions } from "./store/features/project/projectActions";
import { actions as buildGameActions } from "./store/features/buildGame/buildGameMiddleware";

import { setGlobalError } from "./store/features/error/errorSlice";

const urlParams = new URLSearchParams(window.location.search);
const projectPath = urlParams.get("path");

store.dispatch(projectActions.loadProject(projectPath));

watchProject(projectPath, {
  onAddSprite: f => store.dispatch(projectActions.loadSprite(f)),
  onAddBackground: f => store.dispatch(projectActions.loadBackground(f)),
  onAddMusic: f => store.dispatch(projectActions.loadMusic(f)),
  onChangedSprite: f => store.dispatch(projectActions.loadSprite(f)),
  onChangedBackground: f => store.dispatch(projectActions.loadBackground(f)),
  onChangedMusic: f => store.dispatch(projectActions.loadMusic(f)),
  onRemoveSprite: f => store.dispatch(projectActions.removeSprite(f)),
  onRemoveBackground: f => store.dispatch(projectActions.removeBackground(f)),
  onRemoveMusic: f => store.dispatch(projectActions.removeMusic(f)),
  onChangedUI: f => store.dispatch(actions.editUI())
});

window.ActionCreators = ActionCreators;
window.store = store;
window.undo = () => {
  store.dispatch(ActionCreators.undo());
};

window.addEventListener("error", (error) => {
  if(error.message.indexOf("dead code elimination") > -1) {
    return true;
  }  
  error.stopPropagation();
  error.preventDefault();
  // eslint-disable-next-line no-console
  console.error(error);
  store.dispatch(setGlobalError({
    message: error.message,
    filename: error.filename,
    line: error.lineno,
    col: error.colno,
    stackTrace: error.error.stack
  }));
  return false;
});

const onSaveProject = () => {
  store.dispatch(projectActions.saveProject());  
}

const onSaveAndCloseProject = async () => {
  await store.dispatch(projectActions.saveProject());
  window.close();  
}

const onSaveProjectAs = (event, pathName) => {
  store.dispatch(projectActions.saveProject(pathName));
}

const onUndo = () => {
  store.dispatch(ActionCreators.undo());
}

const onRedo = () => {
  store.dispatch(ActionCreators.redo());
}

const onSetSection =  (event, section) => {
  store.dispatch(navigationActions.setSection(section));
}

const onReloadAssets = () => {
  store.dispatch(entityActions.reloadAssets());
}

const onUpdateSetting = (event, setting, value) => {
  store.dispatch(
    settingsActions.editSettings({
      [setting]: value
    })
  );
}

const onZoom = (event, zoomType) => {
  const state = store.getState();
  if (zoomType === "in") {
    store.dispatch(editorActions.zoomIn({ section: state.navigation.section }));
  } else if (zoomType === "out") {
    store.dispatch(editorActions.zoomOut({ section: state.navigation.section }));
  } else {
    store.dispatch(editorActions.zoomReset({ section: state.navigation.section }));
  }
}

const onRun = () => {
  store.dispatch(buildGameActions.buildGame());
}

const onBuild = (event, buildType, eject) => {
  store.dispatch(
    buildGameActions.buildGame({
      buildType,
      exportBuild: !eject,
      ejectBuild: eject
    })
  );
}

const onEjectEngine = () => {
  store.dispatch(buildGameActions.ejectEngine());
}

const onPluginRun = (event, pluginId) => {
  if (plugins.menu[pluginId] && plugins.menu[pluginId].run) {
    plugins.menu[pluginId].run(store, actions);
  }
}

const onPasteInPlace = (event) => {
  try {
    const clipboardData = JSON.parse(clipboard.readText());
    store.dispatch(actions.pasteClipboardEntityInPlace(clipboardData));
  } catch (err) {
    // Clipboard isn't pastable, just ignore it
  }
}

ipcRenderer.on("save-project", onSaveProject);
ipcRenderer.on("save-project-and-close", onSaveAndCloseProject);
ipcRenderer.on("save-as-project", onSaveProjectAs);
ipcRenderer.on("undo", onUndo);
ipcRenderer.on("redo", onRedo);
ipcRenderer.on("section", onSetSection);
ipcRenderer.on("reloadAssets", onReloadAssets);
ipcRenderer.on("updateSetting", onUpdateSetting);
ipcRenderer.on("zoom", onZoom);
ipcRenderer.on("run", onRun);
ipcRenderer.on("build", onBuild);
ipcRenderer.on("ejectEngine", onEjectEngine);
ipcRenderer.on("plugin-run", onPluginRun);
ipcRenderer.on("paste-in-place", onPasteInPlace);

const worldSidebarWidth = settings.get("worldSidebarWidth");
const filesSidebarWidth = settings.get("filesSidebarWidth");

if (worldSidebarWidth) {
  store.dispatch(editorActions.resizeWorldSidebar(worldSidebarWidth));
}
if (filesSidebarWidth) {
  store.dispatch(editorActions.resizeFilesSidebar(filesSidebarWidth));
}

window.addEventListener("resize", debounce(() => {
  const state = store.getState();
  store.dispatch(editorActions.resizeWorldSidebar(state.editor.worldSidebarWidth));
  store.dispatch(editorActions.resizeFilesSidebar(state.editor.filesSidebarWidth));
}, 500));

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
  if(document.activeElement.type === "number"){
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

const render = () => {
  ReactDOM.render(
    <Provider store={store}>
      <AppContainerDnD>
        <App />
      </AppContainerDnD>
    </Provider>,
    document.getElementById("App")
  );
};

render();

if (module.hot) {
  module.hot.accept("./components/app/App", render);
}
