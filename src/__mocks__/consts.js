import path from "path";

const rootDir = path.normalize(`${__dirname}/../../`);
const engineRoot = path.normalize(`${rootDir}/appData/src`);
const buildToolsRoot = path.normalize(`${rootDir}/buildTools`);
const emulatorRoot = path.normalize(`${rootDir}/appData/js-emulator`);
const projectTemplatesRoot = path.normalize(`${rootDir}/appData/templates`);
const localesRoot = path.normalize(`${rootDir}/src/lang`);
const eventsRoot = path.normalize(`${rootDir}/src/lib/events`);
const assetsRoot = path.normalize(`${rootDir}/src/assets`);

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
  assetsRoot,
  MAX_ACTORS,
  MAX_TRIGGERS,
  MIDDLE_MOUSE,
};
