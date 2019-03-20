import path from "path";

const isDist =
  __dirname.endsWith("/dist") ||
  __dirname.endsWith("/dist/windows") ||
  __dirname.endsWith("/dist/windows/help") ||
  __dirname.endsWith("\\dist") ||
  __dirname.endsWith("\\dist\\windows") ||
  __dirname.endsWith("\\dist\\windows\\help");

const rootDir = isDist
  ? __dirname
      .replace(/[\\/]dist[\\/]windows[\\/]help$/, "")
      .replace(/[\\/]dist[\\/]windows$/, "")
      .replace(/[\\/]dist$/, "")
  : path.normalize(__dirname + "/../");

const engineRoot = path.normalize(rootDir + "/data/src");
const buildToolsRoot = path.normalize(rootDir + "/buildTools");
const emulatorRoot = path.normalize(rootDir + "/data/js-emulator");
const projectTemplatesRoot = path.normalize(rootDir + "/data/templates");

console.log({ __dirname, isDist, rootDir, engineRoot, buildToolsRoot, emulatorRoot, projectTemplatesRoot });

export { engineRoot, buildToolsRoot, emulatorRoot, projectTemplatesRoot };
