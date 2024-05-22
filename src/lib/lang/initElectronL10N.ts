import { app } from "electron";
import settings from "electron-settings";
import fs from "fs";
import glob from "glob";
import Path from "path";
import en from "lang/en.json";
import { localesRoot } from "consts";
import { L10NLookup, setL10NData } from "shared/lib/lang/l10n";

const localesPath = `${localesRoot}/*.json`;

export const locales = glob
  .sync(localesPath)
  .map((path) => Path.basename(path, ".json"));

const initElectronL10N = () => {
  const settingsLocale = app && settings.get("locale");
  const systemLocale = app ? app.getLocale() : "en";
  const appLocale = String(settingsLocale || systemLocale);
  loadLanguage(appLocale);
};

export const loadLanguage = (locale: string) => {
  // Reset back to en defaults before loading
  setL10NData(en);

  if (locale && locale !== "en") {
    try {
      const translation = JSON.parse(
        fs.readFileSync(`${localesRoot}/${locale}.json`, "utf-8")
      ) as L10NLookup;
      setL10NData(translation);
      return translation;
    } catch (e) {
      console.warn("No language pack for user setting, falling back to en");
      console.warn(
        `Add a language pack by making the file src/lang/${locale}.json`
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
