import settings from "electron-settings";
import { ipcRenderer } from "electron";

const { systemPreferences } = require("electron").remote;

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
