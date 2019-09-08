/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
/* eslint-disable no-console */
import electron from "electron";
import glob from "glob";
import Path from "path";
import settings from "electron-settings";
import en from "../../lang/en";

export const locales = glob
  .sync(`${__dirname}/../../lang/*.json`)
  .map(path => Path.basename(path, ".json"));

const app = electron.app || (electron.remote && electron.remote.app);
const settingsLocale = app && settings.get("locale");
const systemLocale = app ? app.getLocale() : "en";
const appLocale = settingsLocale || systemLocale;

export const languageOverrides = locale => {
  if (locale && locale !== "en") {
    try {
      return require(`../../lang/${locale}.json`);
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

/*
 * defaultTranslationFn
 *
 * Returns translation overrides for current language where defined and falls
 * back to default language if localistion not provided
 */
export const defaultTranslationFn = (overrides, defaultLang) => (memo, key) => {
  return {
    ...memo,
    [key]: overrides[key] || defaultLang[key]
  };
};

/*
 * debugTranslationFn
 *
 * Returns just the translation keys regardless of current language overrides
 * or default language values. Allows debugging the UI to see exactly which
 * translation keys are used where and to spot text that hasn't yet
 * been localised.
 */
export const debugTranslationFn = (memo, key) => {
  return {
    ...memo,
    [key]: key
  };
};

/*
 * showMissingKeysTranslationFn
 *
 * Returns translation overrides for current language where defined but if no
 * translation is provided for a key it will return the key name instead.
 * Allows debugging which keys haven't yet been translated for the current
 * language.
 */
export const showMissingKeysTranslationFn = overrides => (memo, key) => {
  return {
    ...memo,
    [key]: overrides[key] || key
  };
};

/*
 * makeTranslationFn
 *
 * Returns the translation function to use in l10n based on the language
 * overrides and the current debug mode (set with DEBUG_L10N env varaible)
 */
export const makeTranslationFn = (overrides, defaultLang, debugMode) => {
  if (debugMode === "true") {
    return debugTranslationFn;
  }
  if (debugMode === "missing") {
    return showMissingKeysTranslationFn(overrides);
  }
  return defaultTranslationFn(overrides, defaultLang);
};

const translations = Object.keys(en).reduce(
  makeTranslationFn(languageOverrides(appLocale), en, process.env.DEBUG_L10N)
);

export const replaceParams = (string, params) => {
  let outputString = string;
  Object.keys(params).forEach(param => {
    const pattern = new RegExp(`{${param}}`, "g");
    outputString = outputString.replace(pattern, params[param]);
  });
  return outputString;
};

export const makeTranslator = l10nStrings => (key, params = null) => {
  // console.log("LOCALISE", key, l10nStrings[key], l10nStrings);
  const l10nString = l10nStrings[key];
  if (params) {
    return replaceParams(l10nString, params);
  }
  return l10nString;
};

export default makeTranslator(translations);
