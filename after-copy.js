const fs = require("fs-extra");
const Path = require("path");

const disallowedFiles = [".DS_Store"];

function fileFilter(src, dest) {
  const filename = Path.basename(src);
  return disallowedFiles.indexOf(filename) === -1;
}

function afterCopy(buildPath, electronVersion, platform, arch, callback) {
  // Called from electronPackagerConfig in package.json
  // Copies correct build Tools for architecture
  const toolsDir = "/buildTools/" + platform + "-" + arch;
  const dataDir = "/appData/";

  fs.copy(__dirname + toolsDir, buildPath + toolsDir, { filter: fileFilter })
    .then(() => {
      return fs.copy(__dirname + dataDir, buildPath + dataDir, {
        filter: fileFilter
      });
    })
    .then(() => callback())
    .catch(err => callback(err));
}

module.exports = afterCopy;
