import { app } from "electron";
import settings from "electron-settings";
import { loadLanguage } from "./l10n";

let hasInitialised = false;

const initElectronL10n = () => {
  if (hasInitialised) {
    return;
  }
  forceL10nReload();
};

export const forceL10nReload = () => {
  const settingsLocale = app && settings.get("locale");
  const systemLocale = app ? app.getLocale() : "en";
  const appLocale = String(settingsLocale || systemLocale);
  loadLanguage(appLocale);
  hasInitialised = true;
};

export default initElectronL10n;
