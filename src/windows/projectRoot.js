import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import * as actions from "../actions";
import configureStore from "../store/configureStore";
import { ipcRenderer } from "electron";
import watchProject from "../lib/project/watchProject";
import "../lib/electron/handleFullScreen";
import { ActionCreators } from "redux-undo";
import AppContainerDnD from "../components/app/AppContainerDnD";
const { systemPreferences } = require("electron").remote;

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
window.undo = function() {
  console.log("undo");
  store.dispatch(ActionCreators.undo());
};

ipcRenderer.on("save-project", () => {
  store.dispatch(actions.saveProject());
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
  const App = require("../components/app/App").default;
  ReactDOM.render(
    <Provider store={store}>
      <AppContainerDnD>
        <App />
      </AppContainerDnD>
    </Provider>,
    document.getElementById("App")
  );
};

function updateMyAppTheme(darkMode) {
  console.log("updateMyAppTheme", darkMode);
  const themeStyle = document.getElementById("theme");
  themeStyle.href = "../styles/" + (darkMode ? "theme-dark.css" : "theme.css");
}

if (systemPreferences.subscribeNotification) {
  systemPreferences.subscribeNotification(
    "AppleInterfaceThemeChangedNotification",
    function theThemeHasChanged() {
      updateMyAppTheme(systemPreferences.isDarkMode());
    }
  );
  updateMyAppTheme(systemPreferences.isDarkMode());
}

render();

if (module.hot) {
  module.hot.accept(render);
}
