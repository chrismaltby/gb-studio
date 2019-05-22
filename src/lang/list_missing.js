/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-console */
const locale = process.argv[2];

if (!locale) {
  console.log("No language to check specified");
  console.log("");
  console.log("Run as:");
  console.log("npm run missing-translations pt-PT");
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
  process.exit();
}
const missing = Object.keys(en).reduce((memo, key) => {
  if (translation[key] === undefined) {
    memo.push(key);
  }
  return memo;
}, []);

if (missing.length > 0) {
  console.log("Missing translations for:");
  console.log("");
  missing.forEach(key => {
    console.log(`  "${key}": "${en[key]}",`);
  });
  console.log("");
} else {
  console.log("All good!");
  console.log("");
}
