import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { ActionCreators } from "redux-undo";
import { ipcRenderer, clipboard } from "electron";
import settings from "electron-settings";
import debounce from "lodash/debounce";
import * as actions from "./actions";
import configureStore from "./store/configureStore";
import watchProject from "./lib/project/watchProject";
import App from "./components/app/App";
import "./lib/electron/handleFullScreen";
import AppContainerDnD from "./components/app/AppContainerDnD";
import plugins from "./lib/plugins/plugins";
import "./lib/helpers/handleTheme";
import "./styles/App.css";
import { CMD_STD_ERR, CMD_STD_OUT, SET_SECTION, CMD_START, CMD_COMPLETE } from "./actions/actionTypes";

const store = configureStore();

const urlParams = new URLSearchParams(window.location.search);
const projectPath = urlParams.get("path");

store.dispatch(actions.loadProject(projectPath));
watchProject(projectPath, {
  onAddSprite: f => store.dispatch(actions.loadSprite(f)),
  onAddBackground: f => store.dispatch(actions.loadBackground(f)),
  onAddMusic: f => store.dispatch(actions.loadMusic(f)),
  onChangedSprite: f => store.dispatch(actions.loadSprite(f)),
  onChangedBackground: f => store.dispatch(actions.loadBackground(f)),
  onChangedMusic: f => store.dispatch(actions.loadMusic(f)),
  onRemoveSprite: f => store.dispatch(actions.removeSprite(f)),
  onRemoveBackground: f => store.dispatch(actions.removeBackground(f)),
  onRemoveMusic: f => store.dispatch(actions.removeMusic(f)),
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
  console.error(error);
  store.dispatch(actions.setGlobalError(error.message, error.filename, error.lineno, error.colno, error.error.stack));
  return false;
});

const onSaveProject = () => {
  store.dispatch(actions.saveProject());  
}

const onSaveAndCloseProject = async () => {
  await store.dispatch(actions.saveProject());
  window.close();  
}

const onSaveProjectAs = (event, pathName) => {
  store.dispatch(actions.saveAsProjectAction(pathName));
}

const onUndo = () => {
  store.dispatch(ActionCreators.undo());
}

const onRedo = () => {
  store.dispatch(ActionCreators.redo());
}

const onSetSection =  (event, section) => {
  store.dispatch(actions.setSection(section));
}

const onReloadAssets = () => {
  store.dispatch(actions.reloadAssets());
}

const onUpdateSetting = (event, setting, value) => {
  store.dispatch(
    actions.editProjectSettings({
      [setting]: value
    })
  );
}

const onBuildStart = () => {
  store.dispatch({ type: CMD_START });
}

const onBuildComplete = () => {
  store.dispatch({ type: CMD_COMPLETE });
}

const onBuildStdOut = (event, message) => {
  store.dispatch({ type: CMD_STD_OUT, text: message });
}

const onBuildStdErr = (event, message) => {
  store.dispatch({ type: CMD_STD_ERR, text: message });
  store.dispatch({ type: SET_SECTION, section: "build" });
}

const onZoom = (event, zoomType) => {
  const state = store.getState();
  if (zoomType === "in") {
    store.dispatch(actions.zoomIn(state.navigation.section));
  } else if (zoomType === "out") {
    store.dispatch(actions.zoomOut(state.navigation.section));
  } else {
    store.dispatch(actions.zoomReset(state.navigation.section));
  }
}

const onRun = () => {
  store.dispatch(actions.buildGame());
}

const onBuild = (event, buildType, eject) => {
  store.dispatch(
    actions.buildGame({
      buildType,
      exportBuild: !eject,
      ejectBuild: eject
    })
  );
}

const onEjectEngine = () => {
  console.log("GOT EJECT ENGINE FROM MAIN 12 3")
  store.dispatch(actions.ejectEngine());
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
ipcRenderer.on("build-start", onBuildStart);
ipcRenderer.on("build-complete", onBuildComplete);
ipcRenderer.on("build-stdout", onBuildStdOut);
ipcRenderer.on("build-stderr", onBuildStdErr);
ipcRenderer.on("zoom", onZoom);
ipcRenderer.on("run", onRun);
ipcRenderer.on("build", onBuild);
ipcRenderer.on("ejectEngine", onEjectEngine);
ipcRenderer.on("plugin-run", onPluginRun);
ipcRenderer.on("paste-in-place", onPasteInPlace);

const worldSidebarWidth = settings.get("worldSidebarWidth");
const filesSidebarWidth = settings.get("filesSidebarWidth");

if (worldSidebarWidth) {
  store.dispatch(actions.resizeWorldSidebar(worldSidebarWidth));
}
if (filesSidebarWidth) {
  store.dispatch(actions.resizeFilesSidebar(filesSidebarWidth));
}

window.addEventListener("resize", debounce(() => {
  const state = store.getState();
  store.dispatch(actions.resizeWorldSidebar(state.settings.worldSidebarWidth));
  store.dispatch(actions.resizeFilesSidebar(state.settings.filesSidebarWidth));
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
