/* eslint-disable import/no-unresolved */
/* eslint-disable import/no-webpack-loader-syntax */
import settings from "electron-settings";
import { ipcRenderer, remote } from "electron";
import darkTheme from "!!raw-loader!../../styles/theme-dark.css";
import lightTheme from "!!raw-loader!../../styles/theme.css";

const { nativeTheme } = remote;

const updateMyAppTheme = () => {
  const settingsTheme = settings.get("theme");
  const theme =
    settingsTheme === "dark"
      ? "dark"
      : settingsTheme === "light"
      ? "light"
      : "system";

  const darkMode =
    theme === "dark" || (theme === "system" && nativeTheme.shouldUseDarkColors);

  const themeStyle = document.getElementById("theme");
  themeStyle.innerHTML = darkMode ? darkTheme : lightTheme;

  if (nativeTheme.themeSource !== theme) {
    nativeTheme.themeSource = theme;
  }
};

nativeTheme.on("updated", () => {
  updateMyAppTheme();
});

ipcRenderer.on("update-theme", () => {
  updateMyAppTheme();
});

updateMyAppTheme();
