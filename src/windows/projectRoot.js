import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { ActionCreators } from "redux-undo";
import { ipcRenderer } from "electron";
import settings from "electron-settings";
import { debounce } from "lodash";
import * as actions from "../actions";
import configureStore from "../store/configureStore";
import watchProject from "../lib/project/watchProject";
import App from "../components/app/App";
import "../lib/electron/handleFullScreen";
import AppContainerDnD from "../components/app/AppContainerDnD";
import plugins from "../lib/plugins/plugins";
import "../lib/helpers/handleTheme";

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
  store.dispatch(actions.setGlobalError(error.message, error.filename, error.lineno, error.colno, error.error.stack));
  return false;
});

ipcRenderer.on("save-project", () => {
  store.dispatch(actions.saveProject());
});

ipcRenderer.on("save-project-and-close", async () => {
  await store.dispatch(actions.saveProject());
  window.close();
});

ipcRenderer.on("undo", () => {
  store.dispatch(ActionCreators.undo());
});

ipcRenderer.on("redo", () => {
  store.dispatch(ActionCreators.redo());
});

ipcRenderer.on("section", (event, section) => {
  store.dispatch(actions.setSection(section));
});

ipcRenderer.on("reloadAssets", (event) => {
  store.dispatch(actions.reloadAssets());
});

ipcRenderer.on("updateSetting", (event, setting, value) => {
  store.dispatch(
    actions.editProjectSettings({
      [setting]: value
    })
  );
});

ipcRenderer.on("zoom", (event, zoomType) => {
  const state = store.getState();
  if (zoomType === "in") {
    store.dispatch(actions.zoomIn(state.navigation.section));
  } else if (zoomType === "out") {
    store.dispatch(actions.zoomOut(state.navigation.section));
  } else {
    store.dispatch(actions.zoomReset(state.navigation.section));
  }
});

ipcRenderer.on("run", event => {
  store.dispatch(actions.buildGame());
});

ipcRenderer.on("build", async (event, buildType) => {
  store.dispatch(
    actions.buildGame({
      buildType,
      exportBuild: true
    })
  );
});

ipcRenderer.on("plugin-run", (event, pluginId) => {
  if (plugins.menu[pluginId] && plugins.menu[pluginId].run) {
    plugins.menu[pluginId].run(store, actions);
  }
});

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
  module.hot.accept(render);
}
