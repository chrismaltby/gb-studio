import electron from "electron";
import settings from "electron-settings";
import { loadLanguage } from "./l10n";
import { app as remoteApp } from '@electron/remote';

const initElectronL10n = () => {
  const app = electron.app || remoteApp;
  const settingsLocale = app && settings.getSync("locale");
  const systemLocale = app ? app.getLocale() : "en";
  const appLocale = String(settingsLocale || systemLocale);

  loadLanguage(appLocale);
};

export default initElectronL10n;
