import path from "path";

const isDist = __dirname.indexOf(".webpack") > -1;

const rootDir = isDist
  ? __dirname.substr(0, __dirname.lastIndexOf(".webpack"))
  : __dirname.substr(0, __dirname.lastIndexOf("node_modules"));

const engineRoot = path.normalize(`${rootDir}/appData/src`);
const buildToolsRoot = path.normalize(`${rootDir}/buildTools`);
const emulatorRoot = path.normalize(`${rootDir}/appData/js-emulator`);
const projectTemplatesRoot = path.normalize(`${rootDir}/appData/templates`);
const localesRoot = path.normalize(`${rootDir}/src/lang`);
const eventsRoot = path.normalize(`${rootDir}/src/lib/events`);

const MAX_ACTORS = 9;
const MAX_TRIGGERS = 9;
const MIDDLE_MOUSE = 2;

export {
  engineRoot,
  buildToolsRoot,
  emulatorRoot,
  projectTemplatesRoot,
  localesRoot,
  eventsRoot,
  MAX_ACTORS,
  MAX_TRIGGERS,
  MIDDLE_MOUSE
};
