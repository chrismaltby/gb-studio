const fs = require("fs-extra");

function afterCopy(buildPath, electronVersion, platform, arch, callback) {
  // Called from electronPackagerConfig in package.json
  // Copies correct build Tools for architecture
  const toolsDir = "/buildTools/" + platform + "-" + arch;
  fs.copy(__dirname + toolsDir, buildPath + toolsDir, callback);
}

module.exports = afterCopy;
