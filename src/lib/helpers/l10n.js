import electron from "electron";
import en from "../../lang/en";

const app = electron.app || electron.remote.app;
const locale = app.getLocale();

let languageOverrides = {};
try {
  languageOverrides = require(`../../lang/${locale}.json`);
} catch (e) {
  // No language pack for user setting, falling back to en
}

const translations = Object.keys(en).reduce((memo, key) => {
  memo[key] = languageOverrides[key] || en[key];
  return memo;
}, {});

export default key => {
  return translations[key];
};
