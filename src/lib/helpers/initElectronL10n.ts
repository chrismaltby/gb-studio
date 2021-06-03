import electron from "electron";
import settings from "electron-settings";
import { loadLanguage } from "./l10n";
// TODO: Remove `ts-ignore` when `@electron/remote@1.1.1` is released
//  https://github.com/electron/remote/commit/1502a4cf8dc962feff3aa30ec0cd3a5e8d3ceccd#commitcomment-51695814
// @ts-ignore
import {app as remoteApp} from '@electron/remote/main';

const initElectronL10n = () => {
  const app = electron.app || remoteApp;
  const settingsLocale = app && settings.getSync("locale");
  const systemLocale = app ? app.getLocale() : "en";
  const appLocale = String(settingsLocale || systemLocale);

  loadLanguage(appLocale);
};

export default initElectronL10n;
