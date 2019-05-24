/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
/* eslint-disable no-console */
import electron from "electron";
import en from "../../lang/en";

const app = electron.app || (electron.remote && electron.remote.app);
const locale = app ? app.getLocale() : "en";

let languageOverrides = {};

if (locale && locale !== "en") {
  try {
    languageOverrides = require(`../../lang/${locale}.json`);
  } catch (e) {
    console.warn("No language pack for user setting, falling back to en");
    console.warn(
      `Add a language pack by making the file src/lang/${locale}.json`
    );
  }
}

const makeTranslationFunction = () => {
  if (process.env.DEBUG_L10N === "true") {
    return (memo, key) => {
      return {
        ...memo,
        [key]: key
      };
    };
  }
  if (process.env.DEBUG_L10N === "missing") {
    return (memo, key) => {
      return {
        ...memo,
        [key]: languageOverrides[key] || key
      };
    };
  }
  return (memo, key) => {
    return {
      ...memo,
      [key]: languageOverrides[key] || en[key]
    };
  };
};

const translations = Object.keys(en).reduce(makeTranslationFunction());

export default (key, params = null) => {
  let translation = translations[key];

  if (params) {
    Object.keys(params).forEach(param => {
      const pattern = new RegExp(`{(\s+)?${param}(\s+)?}`);
      translation = translation.replace(pattern, params[param]);
    });
  }

  return translation;
};
