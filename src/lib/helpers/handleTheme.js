import settings from "electron-settings";
import { ipcRenderer } from "electron";
import darkTheme from "!!raw-loader!../../styles/theme-dark.css";
import lightTheme from "!!raw-loader!../../styles/theme.css";

const { systemPreferences } = require("electron").remote;

function updateMyAppTheme() {
  const darkMode =
    settings.get("theme") === "dark" ||
    (settings.get("theme") === undefined &&
      systemPreferences.isDarkMode &&
      systemPreferences.isDarkMode());
  const themeStyle = document.getElementById("theme");
  themeStyle.innerHTML = darkMode ? darkTheme : lightTheme;
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
