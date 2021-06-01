const fs = require("fs-extra");
const Path = require("path");
const glob = require("glob").sync;

const disallowedFiles = [".DS_Store"];

function fileFilter(src, dest) {
  const filename = Path.basename(src);
  return disallowedFiles.indexOf(filename) === -1;
}

function afterCopy(buildPath, electronVersion, platform, arch, callback) {
  // Called from packagerConfig in forge.config.js
  // Copies correct build Tools for architecture + dynamically loaded js/json files
  const copyPaths = [
    "/buildTools/" + platform + "-" + arch,
    "/appData/",
    "/src/lang",
    "/src/lib/events",
    "/src/assets",
  ];

  Promise.all(
    copyPaths.map((dir) => {
      return fs.copy(__dirname + "/../../../.." + dir, buildPath + dir, {
        filter: fileFilter,
      });
    })
  )
    .then(() => {
      const dynamicChunks = glob(__dirname + "/.webpack/renderer/[0-9]");
      return Promise.all(
        dynamicChunks.map((dynamicChunk) => {
          const outputPath =
            buildPath +
            "/.webpack/renderer/main_window/" +
            Path.basename(dynamicChunk);
          return fs.copy(dynamicChunk, outputPath, { filter: fileFilter });
        })
      );
    })
    .then(() => callback())
    .catch((err) => callback(err));
}

module.exports = afterCopy;
