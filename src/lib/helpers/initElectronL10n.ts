import electron from "electron";
import settings from "electron-settings";
import { loadLanguage } from "./l10n";

const initElectronL10n = () => {
  const app = electron.app;
  const settingsLocale = app && settings.getSync("locale");
  const systemLocale = app ? app.getLocale() : "en";
  const appLocale = String(settingsLocale || systemLocale);

  loadLanguage(appLocale);
};

export default initElectronL10n;
