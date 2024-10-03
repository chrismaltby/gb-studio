import path from "path";
import type { Palette } from "shared/lib/entities/entitiesTypes";
import { Settings } from "shared/lib/resources/types";

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

export const MAX_BACKGROUND_TILES = 16 * 12;
export const MAX_BACKGROUND_TILES_CGB = 16 * 12 * 2;

const SCREEN_WIDTH = 20;
const SCREEN_HEIGHT = 18;
const MAX_ONSCREEN = 10;
const MAX_NESTED_SCRIPT_DEPTH = 5;
export const MAX_PROJECTILES = 5;
export const TILE_SIZE = 8;

const MIDDLE_MOUSE = 2;

export const NAVIGATOR_MIN_WIDTH = 200;

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

export const COLLISIONS_EXTRA_SYMBOLS = "89ABCDEF";

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
} as Palette; //TODO: make this configurable via preferences -NB

export const FLAG_VRAM_BANK_1 = 0x8;

export const TMP_VAR_1 = "T0";
export const TMP_VAR_2 = "T1";

export const TRACKER_UNDO = "TRACKER_UNDO";
export const TRACKER_REDO = "TRACKER_REDO";

export const ERR_PROJECT_EXISTS = "ERR_PROJECT_EXISTS";

// @TODO Check if any uses of these hard coded event types can be made more generic to not need to know the specific event used
export const EVENT_TEXT = "EVENT_TEXT";
export const EVENT_CALL_CUSTOM_EVENT = "EVENT_CALL_CUSTOM_EVENT";
export const EVENT_SWITCH_SCENE = "EVENT_SWITCH_SCENE";
export const EVENT_ACTOR_SET_SPRITE = "EVENT_ACTOR_SET_SPRITE";
export const EVENT_PLAYER_SET_SPRITE = "EVENT_PLAYER_SET_SPRITE";
export const EVENT_COMMENT = "EVENT_COMMENT";
export const EVENT_END = "EVENT_END";
export const EVENT_ENGINE_FIELD_SET = "EVENT_ENGINE_FIELD_SET";
export const EVENT_ENGINE_FIELD_STORE = "EVENT_ENGINE_FIELD_STORE";
export const EVENT_IF_TRUE = "EVENT_IF_TRUE";
export const EVENT_SOUND_PLAY_EFFECT = "EVENT_SOUND_PLAY_EFFECT";
export const EVENT_FADE_IN = "EVENT_FADE_IN";
export const EVENT_MUSIC_PLAY = "EVENT_MUSIC_PLAY";
export const EVENT_GROUP = "EVENT_GROUP";

export const LYC_SYNC_VALUE = 150;

export const defaultProjectSettings: Settings = {
  startSceneId: "",
  startX: 0,
  startY: 0,
  startMoveSpeed: 1,
  startAnimSpeed: 3,
  startDirection: "down",
  showCollisions: true,
  showConnections: "selected",
  showCollisionSlopeTiles: false,
  showCollisionExtraTiles: false,
  worldScrollX: 0,
  worldScrollY: 0,
  zoom: 100,
  sgbEnabled: false,
  customHead: "",
  defaultBGP: [0, 1, 2, 3],
  defaultOBP0: [0, 0, 1, 3],
  defaultOBP1: [0, 0, 2, 3],
  defaultBackgroundPaletteIds: [
    "default-bg-1",
    "default-bg-2",
    "default-bg-3",
    "default-bg-4",
    "default-bg-5",
    "default-bg-6",
    "default-bg-7",
    "default-ui",
  ],
  defaultSpritePaletteIds: [
    "default-sprite-1",
    "default-sprite-2",
    "default-sprite-3",
    "default-sprite-4",
    "default-sprite-5",
    "default-sprite-6",
    "default-sprite-7",
    "default-sprite-8",
  ],
  defaultSpritePaletteId: "default-sprite",
  defaultUIPaletteId: "default-ui",
  playerPaletteId: "",
  navigatorSplitSizes: [400, 30, 30, 30, 30],
  showNavigator: true,
  defaultFontId: "",
  defaultCharacterEncoding: "",
  defaultPlayerSprites: {},
  musicDriver: "gbt",
  cartType: "mbc5",
  batterylessEnabled: false,
  favoriteEvents: ["EVENT_TEXT", "EVENT_SWITCH_SCENE"],
  customColorsWhite: "E8F8E0",
  customColorsLight: "B0F088",
  customColorsDark: "509878",
  customColorsBlack: "202850",
  customControlsUp: ["ArrowUp", "w"],
  customControlsDown: ["ArrowDown", "s"],
  customControlsLeft: ["ArrowLeft", "a"],
  customControlsRight: ["ArrowRight", "d"],
  customControlsA: ["Alt", "z", "j"],
  customControlsB: ["Control", "k", "x"],
  customControlsStart: ["Enter"],
  customControlsSelect: ["Shift"],
  debuggerEnabled: false,
  debuggerScriptType: "editor",
  debuggerVariablesFilter: "all",
  debuggerCollapsedPanes: [],
  debuggerPauseOnScriptChanged: false,
  debuggerPauseOnWatchedVariableChanged: false,
  debuggerBreakpoints: [],
  debuggerWatchedVariables: [],
  colorMode: "mixed",
  previewAsMono: false,
  openBuildLogOnWarnings: true,
  generateDebugFilesEnabled: false,
  compilerPreset: 3000,
  scriptEventPresets: {},
  scriptEventDefaultPresets: {},
};

export const defaultPalettes: Palette[] = [
  {
    id: "default-bg-1",
    name: "Default BG 1",
    colors: ["F8E8C8", "D89048", "A82820", "301850"],
  },
  {
    id: "default-bg-2",
    name: "Default BG 2",
    colors: ["E0F8A0", "78C838", "488818", "081800"],
  },
  {
    id: "default-bg-3",
    name: "Default BG 3",
    colors: ["F8D8A8", "E0A878", "785888", "002030"],
  },
  {
    id: "default-bg-4",
    name: "Default BG 4",
    colors: ["B8D0D0", "D880D8", "8000A0", "380000"],
  },
  {
    id: "default-bg-5",
    name: "Default BG 5",
    colors: ["F8F8B8", "90C8C8", "486878", "082048"],
  },
  {
    id: "default-bg-6",
    name: "Default BG 6",
    colors: ["F8D8B0", "78C078", "688840", "583820"],
  },
  {
    id: "default-sprite",
    name: "Default Sprites",
    colors: ["F8F0E0", "D88078", "B05010", "000000"],
  },
  {
    id: "default-ui",
    name: "Default UI",
    colors: ["F8F8B8", "90C8C8", "486878", "082048"],
  },
] as {
  id: string;
  name: string;
  colors: [string, string, string, string];
}[];

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
