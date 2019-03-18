import path from "path";

const engineRoot = __dirname.endsWith("/dist")
  ? path.normalize(__dirname + "/../src/data/src")
  : path.normalize(__dirname + "/data/src");

const buildToolsRoot = __dirname.endsWith("/dist")
  ? path.normalize(__dirname + "/../buildTools")
  : path.normalize(__dirname + "/../buildTools");

const emulatorRoot = __dirname.endsWith("/dist")
  ? path.normalize(__dirname + "/../src/data/js-emulator")
  : path.normalize(__dirname + "/data/js-emulator");

const projectTemplatesRoot = __dirname.endsWith("/dist")
  ? path.normalize(__dirname + "/../src/data/templates")
  : path.normalize(__dirname + "/data/templates");

console.log({ __dirname, engineRoot, buildToolsRoot, emulatorRoot });

export { engineRoot, buildToolsRoot, emulatorRoot, projectTemplatesRoot };
