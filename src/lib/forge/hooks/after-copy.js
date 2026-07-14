const fs = require("fs-extra");
const Path = require("path");
const { globSync } = require("glob");

const disallowedFiles = [".DS_Store"];

const disallowedDirs = [
  "appData/engine/gbvm/test",
  "appData/engine/gbvm/examples",
  "gbdk/examples",
];

const isAllowedPath = (inputPath, disallowedPaths) => {
  const normalizedInput = Path.normalize(inputPath).replace(/\\/g, "/");
  return !disallowedPaths.some((p) =>
    normalizedInput.includes(Path.normalize(p).replace(/\\/g, "/")),
  );
};

function fileFilter(src, dest) {
  const filename = Path.basename(src);
  return (
    disallowedFiles.indexOf(filename) === -1 &&
    isAllowedPath(src, disallowedDirs)
  );
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
    }),
  )
    .then(() => {
      const dynamicChunks = globSync(".webpack/renderer/[0-9]", {
        cwd: __dirname,
        absolute: true,
      }).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
      return Promise.all(
        dynamicChunks.map((dynamicChunk) => {
          const outputPath =
            buildPath +
            "/.webpack/renderer/main_window/" +
            Path.basename(dynamicChunk);
          return fs.copy(dynamicChunk, outputPath, { filter: fileFilter });
        }),
      );
    })
    .then(() => callback())
    .catch((err) => callback(err));
}

module.exports = afterCopy;
