const fs = require("fs-extra");

function afterCopy(buildPath, electronVersion, platform, arch, callback) {
  // Called from electronPackagerConfig in package.json
  // Copies correct build Tools for architecture
  const toolsDir = "/buildTools/" + platform + "-" + arch;
  const dataDir = "/data/";

  fs.copy(__dirname + toolsDir, buildPath + toolsDir)
    .then(() => {
      return fs.copy(__dirname + dataDir, buildPath + dataDir);
    })
    .then(() => callback())
    .catch(err => callback(err));
}

module.exports = afterCopy;
