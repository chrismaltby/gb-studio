/* eslint-disable @typescript-eslint/no-var-requires */
const Path = require("path");

const repoPath = (...subdirs) =>
  Path.resolve(__dirname, "..", "..", "..", ...subdirs);

const srcPath = (...subdirs) => repoPath("src", ...subdirs);

const appPath = (appName, ...subdirs) => srcPath("apps", appName, ...subdirs);

module.exports = {
  appPath,
  repoPath,
  srcPath,
};
