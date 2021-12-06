import path from "path";

const isDist = __dirname.indexOf(".webpack") > -1;
const isCli = __dirname.indexOf("out/cli") > -1;

let rootDir = __dirname.substr(0, __dirname.lastIndexOf("node_modules"));
if (isDist) {
  rootDir = __dirname.substr(0, __dirname.lastIndexOf(".webpack"));
} else if (isCli) {
  rootDir = __dirname.substr(0, __dirname.lastIndexOf("out/cli"));
} else if (process.env.NODE_ENV === "test") {
  rootDir = path.normalize(`${__dirname}/../`);
}

const engineRoot = path.normalize(`${rootDir}/appData/src`);
const buildToolsRoot = path.normalize(`${rootDir}/buildTools`);
const emulatorRoot = path.normalize(`${rootDir}/appData/js-emulator`);
const binjgbRoot = path.normalize(`${rootDir}/appData/wasm/binjgb`);
const projectTemplatesRoot = path.normalize(`${rootDir}/appData/templates`);
const localesRoot = path.normalize(`${rootDir}/src/lang`);
const eventsRoot = path.normalize(`${rootDir}/src/lib/events`);
const assetsRoot = path.normalize(`${rootDir}/src/assets`);

const MAX_ACTORS = 20;
const MAX_ACTORS_SMALL = 10;
const MAX_TRIGGERS = 30;
const MAX_FRAMES = 25;
const MAX_SPRITE_TILES = 64;
const SCREEN_WIDTH = 20;
const SCREEN_HEIGHT = 18;
const MAX_ONSCREEN = 10;
const MAX_NESTED_SCRIPT_DEPTH = 5;

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

export const COLLISION_TOP = 0x1;
export const COLLISION_BOTTOM = 0x2;
export const COLLISION_LEFT = 0x4;
export const COLLISION_RIGHT = 0x8;
export const COLLISION_ALL = 0xf;
export const TILE_PROP_LADDER = 0x10;
export const TILE_PROPS = 0xf0;

export const DRAG_PLAYER = "DRAG_PLAYER";
export const DRAG_DESTINATION = "DRAG_DESTINATION";
export const DRAG_ACTOR = "DRAG_ACTOR";
export const DRAG_TRIGGER = "DRAG_TRIGGER";

export const DMG_PALETTE = {
  id: "dmg",
  name: "DMG (GB Default)",
  colors: ["E8F8E0", "B0F088", "509878", "202850"],
};

export const TMP_VAR_1 = "T0";
export const TMP_VAR_2 = "T1";

export {
  engineRoot,
  buildToolsRoot,
  emulatorRoot,
  binjgbRoot,
  projectTemplatesRoot,
  localesRoot,
  eventsRoot,
  assetsRoot,
  MAX_ACTORS,
  MAX_ACTORS_SMALL,
  MAX_TRIGGERS,
  MAX_FRAMES,
  MAX_SPRITE_TILES,
  MAX_ONSCREEN,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  MIDDLE_MOUSE,
  MAX_NESTED_SCRIPT_DEPTH,
};
