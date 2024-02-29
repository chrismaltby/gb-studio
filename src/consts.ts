import path from "path";
import type { Palette } from "store/features/entities/entitiesTypes";

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

export const buildUUID = "_gbsbuild";
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
export const MAX_PROJECTILES = 5;
export const TILE_SIZE = 8;

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
export const BRUSH_MAGIC = "magic";
export const BRUSH_SLOPE = "slope";

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

export const TILE_PROP_SLOPE_45 = 0x20;
export const TILE_PROP_SLOPE_22_BOT = 0x40;
export const TILE_PROP_SLOPE_22_TOP = 0x60;
export const TILE_PROP_SLOPE_LEFT = 0x10;

export const COLLISION_SLOPE_45_RIGHT = TILE_PROP_SLOPE_45;
export const COLLISION_SLOPE_22_RIGHT_BOT = TILE_PROP_SLOPE_22_BOT;
export const COLLISION_SLOPE_22_RIGHT_TOP = TILE_PROP_SLOPE_22_TOP;
export const COLLISION_SLOPE_45_LEFT =
  TILE_PROP_SLOPE_45 | TILE_PROP_SLOPE_LEFT;
export const COLLISION_SLOPE_22_LEFT_BOT =
  TILE_PROP_SLOPE_22_BOT | TILE_PROP_SLOPE_LEFT;
export const COLLISION_SLOPE_22_LEFT_TOP =
  TILE_PROP_SLOPE_22_TOP | TILE_PROP_SLOPE_LEFT;

export const COLLISION_SLOPE_VALUES = [
  COLLISION_SLOPE_45_RIGHT,
  COLLISION_SLOPE_22_RIGHT_BOT,
  COLLISION_SLOPE_22_RIGHT_TOP,
  COLLISION_SLOPE_45_LEFT,
  COLLISION_SLOPE_22_LEFT_BOT,
  COLLISION_SLOPE_22_LEFT_TOP,
];

export const TILE_COLOR_PALETTE = 0x7;
export const TILE_COLOR_PROPS = 0xf8;
export const TILE_COLOR_PROP_PRIORITY = 0x80;

export const DRAG_PLAYER = "DRAG_PLAYER";
export const DRAG_DESTINATION = "DRAG_DESTINATION";
export const DRAG_ACTOR = "DRAG_ACTOR";
export const DRAG_TRIGGER = "DRAG_TRIGGER";

export const DMG_PALETTE = {
  id: "dmg",
  name: "DMG (GB Default)",
  colors: ["E8F8E0", "B0F088", "509878", "202850"],
} as Palette;

export const TMP_VAR_1 = "T0";
export const TMP_VAR_2 = "T1";

export const TRACKER_UNDO = "TRACKER_UNDO";
export const TRACKER_REDO = "TRACKER_REDO";

export const ERR_PROJECT_EXISTS = "ERR_PROJECT_EXISTS";

// @TODO Check if any uses of these hard coded event types can be made more generic to not need to know the specific event used
export const EVENT_TEXT = "EVENT_TEXT";
export const EVENT_CAMERA_MOVE_TO = "EVENT_CAMERA_MOVE_TO";
export const EVENT_ACTOR_MOVE_TO = "EVENT_ACTOR_MOVE_TO";
export const EVENT_ACTOR_SET_POSITION = "EVENT_ACTOR_SET_POSITION";
export const EVENT_OVERLAY_SHOW = "EVENT_OVERLAY_SHOW";
export const EVENT_OVERLAY_MOVE_TO = "EVENT_OVERLAY_MOVE_TO";
export const EVENT_IF_ACTOR_AT_POSITION = "EVENT_IF_ACTOR_AT_POSITION";
export const EVENT_IF_ACTOR_DISTANCE_FROM_ACTOR =
  "EVENT_IF_ACTOR_DISTANCE_FROM_ACTOR";
export const EVENT_CALL_CUSTOM_EVENT = "EVENT_CALL_CUSTOM_EVENT";
export const EVENT_SWITCH_SCENE = "EVENT_SWITCH_SCENE";
export const EVENT_ACTOR_SET_SPRITE = "EVENT_ACTOR_SET_SPRITE";
export const EVENT_PLAYER_SET_SPRITE = "EVENT_PLAYER_SET_SPRITE";

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
