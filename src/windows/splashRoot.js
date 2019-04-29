import React from "react";
import ReactDOM from "react-dom";
import { AppContainer } from "react-hot-loader";
import settings from "electron-settings";
import { ipcRenderer } from "electron";
const { systemPreferences } = require("electron").remote;

ipcRenderer.on("update-theme", event => {
  updateMyAppTheme();
});

const render = () => {
  const Splash = require("../components/app/Splash").default;
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
  themeStyle.href = "../styles/" + (darkMode ? "theme-dark.css" : "theme.css");
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

if (module.hot) {
  module.hot.accept(render);
}
