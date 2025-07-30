import { app } from "electron";
import settings from "electron-settings";
import fs from "fs";
import glob from "glob";
import Path from "path";
import en from "lang/en.json";
import { LOCALE_SETTING_KEY, localesRoot } from "consts";
import { L10NLookup, setL10NData } from "shared/lib/lang/l10n";
import { getGlobalPluginsPath } from "lib/pluginManager/globalPlugins";
import mapValues from "lodash/mapValues";

const localesPath = `${localesRoot}/*.json`;

export const locales = glob
  .sync(localesPath)
  .map((path) => Path.basename(path, ".json"));

export const getAppLocale = () => {
  const settingsLocale = app && settings.get(LOCALE_SETTING_KEY);
  const systemLocale = app ? app.getLocale() : "en";
  return String(settingsLocale || systemLocale);
};

const initElectronL10N = () => {
  const appLocale = getAppLocale();
  loadLanguage(appLocale);
};

export const loadLanguage = (locale: string) => {
  // Reset back to en defaults before loading
  setL10NData(en);

  if (locale && locale !== "en") {
    try {
      const isPlugin = Path.basename(locale) === "lang.json";
      const globalPluginsPath = getGlobalPluginsPath();

      if (isPlugin) {
        const translation = JSON.parse(
          fs.readFileSync(`${globalPluginsPath}/${locale}`, "utf-8"),
        ) as L10NLookup;

        // If localisation has debug flag set all missing values will
        // use translation keys rather than fallback to English
        if (translation.debug) {
          const debugLang = mapValues(en, (_value, key) => key);
          setL10NData(debugLang);
        }

        setL10NData(translation);
        return translation;
      } else {
        const translation = JSON.parse(
          fs.readFileSync(`${localesRoot}/${locale}.json`, "utf-8"),
        ) as L10NLookup;
        setL10NData(translation);
        return translation;
      }
    } catch (e) {
      console.warn("No language pack for user setting, falling back to en");
      console.warn(
        `Add a language pack by making the file src/lang/${locale}.json`,
      );
    }
  }
  if (typeof locale === "string" && locale.length === 0) {
    console.warn("Locale is set but doesn't have a value.");
    console.warn("Have you used l10n from electron before app is ready?");
    console.trace();
  }
  return {};
};

export default initElectronL10N;
