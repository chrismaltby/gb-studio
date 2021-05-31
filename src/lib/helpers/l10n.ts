import fs from "fs";
import glob from "glob";
import Path from "path";
import en from "../../lang/en.json";
import { localesRoot } from "../../consts";

interface L10NLookup {
  [key: string]: string | boolean | undefined;
}

interface L10NParams {
  [key: string]: string | number | undefined;
}

const localesPath = `${localesRoot}/*.json`;

const l10nStrings: L10NLookup = en;

export const locales = glob
  .sync(localesPath)
  .map((path) => Path.basename(path, ".json"));

const translate = (key: string, params?: L10NParams): string => {
  if (process.env.DEBUG_L10N) {
    return key;
  }
  const l10nString = l10nStrings[key] || key;
  if (typeof l10nString === "string") {
    if (params) {
      return replaceParams(l10nString, params);
    }
    return l10nString;
  }
  return String(l10nString);
};

export const replaceParams = (string: string, params: L10NParams) => {
  let outputString = string;
  Object.keys(params).forEach((param) => {
    const pattern = new RegExp(`{${param}}`, "g");
    const paramValue = String(params[param] || "");
    outputString = outputString.replace(pattern, paramValue);
  });
  return outputString;
};

export const loadLanguage = (locale: string) => {
  if (locale && locale !== "en") {
    try {
      const translation = JSON.parse(
        fs.readFileSync(`${localesRoot}/${locale}.json`, "utf-8")
      ) as L10NLookup;
      for (const key in translation) {
        l10nStrings[key] = translation[key];
      }
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

export const isRTL = (): boolean => {
  return !!l10nStrings.RTL;
};

export default translate;
