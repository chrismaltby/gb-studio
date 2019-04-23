import path from "path";

const gbStudioVersion = '1.0.0.0';

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

const engineRoot = path.normalize(rootDir + "/appData/src");
const buildToolsRoot = path.normalize(rootDir + "/buildTools");
const emulatorRoot = path.normalize(rootDir + "/appData/js-emulator");
const projectTemplatesRoot = path.normalize(rootDir + "/appData/templates");

export { gbStudioVersion, engineRoot, buildToolsRoot, emulatorRoot, projectTemplatesRoot };
