import path from "path";

const isDist = __dirname.indexOf(".webpack") > -1;
const isCli = __dirname.indexOf("out/cli") > -1;

const rootDir = isDist
  ? __dirname.substr(0, __dirname.lastIndexOf(".webpack"))
  : isCli
  ? __dirname.substr(0, __dirname.lastIndexOf("out/cli"))
  : __dirname.substr(0, __dirname.lastIndexOf("node_modules"));

const engineRoot = path.normalize(`${rootDir}/appData/src`);
const buildToolsRoot = path.normalize(`${rootDir}/buildTools`);
const emulatorRoot = path.normalize(`${rootDir}/appData/js-emulator`);
const projectTemplatesRoot = path.normalize(`${rootDir}/appData/templates`);
const localesRoot = path.normalize(`${rootDir}/src/lang`);
const eventsRoot = path.normalize(`${rootDir}/src/lib/events`);
const assetsRoot = path.normalize(`${rootDir}/src/assets`);

const MAX_ACTORS = 30;
const MAX_TRIGGERS = 30;
const MIDDLE_MOUSE = 2;

export const TOOL_SELECT = "select";
export const TOOL_ACTORS = "actors";
export const TOOL_COLLISIONS = "collisions";
export const TOOL_COLORS = "colors";
export const TOOL_SCENE = "scene";
export const TOOL_TRIGGERS = "triggers";
export const TOOL_ERASER = "eraser";

export const BRUSH_8PX = "8px";
export const BRUSH_16PX = "16px";
export const BRUSH_FILL = "fill";

export const SPRITE_TYPE_STATIC = "static";
export const SPRITE_TYPE_ACTOR = "actor";
export const SPRITE_TYPE_ACTOR_ANIMATED = "actor_animated";
export const SPRITE_TYPE_ANIMATED = "animated";

export const DMG_PALETTE = {
  id: "dmg",
  name: "DMG (GB Default)",
  colors: [ "E8F8E0", "B0F088", "509878", "202850" ]
};

export const TMP_VAR_1 = "T0";
export const TMP_VAR_2 = "T1";

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
  MIDDLE_MOUSE
};
