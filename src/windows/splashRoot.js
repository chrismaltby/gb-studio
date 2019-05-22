import React from "react";
import ReactDOM from "react-dom";
import { AppContainer } from "react-hot-loader";
import settings from "electron-settings";
import { ipcRenderer } from "electron";
import Splash from "../components/app/Splash";
import "../lib/electron/handleFullScreen";

const { systemPreferences } = require("electron").remote;

const render = () => {
  ReactDOM.render(
    <AppContainer>
      <Splash />
    </AppContainer>,
    document.getElementById("App")
  );
};

render();

function updateMyAppTheme() {
  const darkMode =
    settings.get("theme") === "dark" ||
    (settings.get("theme") === undefined &&
      systemPreferences.isDarkMode &&
      systemPreferences.isDarkMode());
  const themeStyle = document.getElementById("theme");
  const cssFile = darkMode ? "theme-dark.css" : "theme.css";
  themeStyle.href = `../styles/${cssFile}`;
}

if (systemPreferences.subscribeNotification) {
  systemPreferences.subscribeNotification(
    "AppleInterfaceThemeChangedNotification",
    function theThemeHasChanged() {
      updateMyAppTheme();
    }
  );
}

updateMyAppTheme();

ipcRenderer.on("update-theme", () => {
  updateMyAppTheme();
});

if (module.hot) {
  module.hot.accept(render);
}
