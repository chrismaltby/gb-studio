/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-console */
const fs = require("fs");
const locale = process.argv[2];

if (!locale) {
  console.log("No language to check specified");
  console.log("");
  console.log("Run as:");
  console.log("npm run missing-translations pt-PT");
  console.log("");
  process.exit();
}

if (locale === "en") {
  console.log("Can't run script on English language file.");
  console.log("");
  process.exit();
}

console.log(`Check for missing translation keys in ${locale}.json`);
console.log("");

const en = require(`${__dirname}/en.json`);
let translation = {};
try {
  translation = require(`${__dirname}/${locale}.json`);
} catch (e) {
  console.log(`Translation file not found ${locale}.json`);
  console.log("Creating...");
  console.log("");
}

const newTranslation = {};
const removedKeys = [];
const untranslatedKeys = [];
Object.keys(en).forEach((key) => {
  if (
    !key.startsWith("//") &&
    typeof en[key] === "string" &&
    (translation[key] === undefined || translation[key] === en[key])
  ) {
    untranslatedKeys.push(key);
  }
  newTranslation[key] = translation[key] || en[key];
});

Object.keys(translation).forEach((key) => {
  if (en[key] === undefined) {
    removedKeys.push(key);
  }
});

if (removedKeys.length > 0) {
  console.log("Removed keys that were no longer in use");
  console.log(
    removedKeys.map((key) => `  ${key}: "${translation[key]}"`).join("\n")
  );
}

if (untranslatedKeys.length > 0) {
  console.log("Untranslated keys:");
  console.log(
    untranslatedKeys.map((key) => `  ${key}: "${en[key]}"`).join("\n")
  );
}

fs.writeFileSync(
  `${__dirname}/${locale}.json`,
  JSON.stringify(newTranslation, null, 2)
);
