import { normalize } from "path";
import type { Palette } from "shared/lib/entities/entitiesTypes";
import { CollisionTileDef, Settings } from "shared/lib/resources/types";

const isDist = __dirname.indexOf(".webpack") > -1;
const isCli = __dirname.indexOf("out/cli") > -1;

let rootDir = __dirname.substring(0, __dirname.lastIndexOf("node_modules"));
if (isDist) {
  rootDir = __dirname.substring(0, __dirname.lastIndexOf(".webpack"));
} else if (isCli) {
  rootDir = __dirname.substring(0, __dirname.lastIndexOf("out/cli"));
} else if (process.env.NODE_ENV === "test") {
  rootDir = normalize(`${__dirname}/../`);
}

// Paths
export const buildUUID = "_gbsbuild";
export const enginesRoot = normalize(`${rootDir}/appData/engine`);
export const defaultEngineRoot = normalize(`${enginesRoot}/gbvm`);
export const defaultEngineMetaPath = normalize(`${enginesRoot}/engine.json`);
export const buildToolsRoot = normalize(`${rootDir}/buildTools`);
export const binjgbRoot = normalize(`${rootDir}/appData/wasm/binjgb`);
export const projectTemplatesRoot = normalize(`${rootDir}/appData/templates`);
export const localesRoot = normalize(`${rootDir}/src/lang`);
export const eventsRoot = normalize(`${rootDir}/src/lib/events`);
export const assetsRoot = normalize(`${rootDir}/src/assets`);

// Plugin Manager
export const OFFICIAL_REPO_URL = "https://plugins.gbstudio.dev/repository.json";
export const OFFICIAL_REPO_GITHUB =
  "https://github.com/gb-studio-dev/gb-studio-plugins";
export const OFFICIAL_REPO_GITHUB_SUBMIT = `${OFFICIAL_REPO_GITHUB}#submitting-plugins`;

// Electron Settings
export const THEME_SETTING_KEY = "themeId";
export const LOCALE_SETTING_KEY = "locale";
export const EMULATOR_MUTED_SETTING_KEY = "emulatorMuted";

// Subpixel bits
export const NUM_SUBPIXEL_BITS = 5;

// Scene Limits
export const MAX_ACTORS = 20;
export const MAX_ACTORS_SMALL = 10;
export const MAX_TRIGGERS = 30;
export const MAX_ONSCREEN = 10;
export const MAX_PROJECTILES = 5;

// Background Limits
export const MAX_BACKGROUND_TILES = 16 * 12;
export const MAX_BACKGROUND_TILES_CGB = 16 * 12 * 2;

// Screen
export const SCREEN_WIDTH = 20;
export const SCREEN_HEIGHT = 18;
export const TILE_SIZE = 8;

export const SCREEN_WIDTH_PX = SCREEN_WIDTH * TILE_SIZE;
export const SCREEN_HEIGHT_PX = SCREEN_HEIGHT * TILE_SIZE;

export const SCENE_MAX_SIZE_PX = 2040;

// Scripts
export const MAX_NESTED_SCRIPT_DEPTH = 5;

// Input
export const MIDDLE_MOUSE = 2;

// IDE UI
export const NAVIGATOR_MIN_WIDTH = 200;
export const DRAG_PLAYER = "DRAG_PLAYER";
export const DRAG_DESTINATION = "DRAG_DESTINATION";
export const DRAG_ACTOR = "DRAG_ACTOR";
export const DRAG_TRIGGER = "DRAG_TRIGGER";

// Tools
export const TOOL_SELECT = "select";
export const TOOL_ACTORS = "actors";
export const TOOL_COLLISIONS = "collisions";
export const TOOL_COLORS = "colors";
export const TOOL_SCENE = "scene";
export const TOOL_TRIGGERS = "triggers";
export const TOOL_ERASER = "eraser";

// Brushes
export const BRUSH_8PX = "8px";
export const BRUSH_16PX = "16px";
export const BRUSH_FILL = "fill";
export const BRUSH_MAGIC = "magic";
export const BRUSH_SLOPE = "slope";

// Collisions
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

// Colors
export const TILE_COLOR_PALETTE = 0x7;
export const TILE_COLOR_PROPS = 0xf8;
export const TILE_COLOR_PROP_PRIORITY = 0x80;
export const DMG_PALETTE = {
  id: "dmg",
  name: "DMG (GB Default)",
  colors: ["E8F8E0", "B0F088", "509878", "202850"],
} as Palette;

// DMG Hardware
export const FLAG_VRAM_BANK_1 = 0x8;
export const LYC_SYNC_VALUE = 150;

// Variables
export const TMP_VAR_1 = "T0";
export const TMP_VAR_2 = "T1";

// Music Editor
export const TRACKER_UNDO = "TRACKER_UNDO";
export const TRACKER_REDO = "TRACKER_REDO";

// Errors
export const ERR_PROJECT_EXISTS = "ERR_PROJECT_EXISTS";

// Script Event Commands
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

export const defaultCollisionTileIcon = "FFFFFFFFFFFFFFFF";
export const defaultCollisionTileColor = "#FF0000FF";

export const defaultCollisionTileDefs: CollisionTileDef[] = [
  {
    key: "solid",
    color: "#FA2828FF",
    mask: COLLISION_ALL,
    flag: COLLISION_ALL,
    name: "FIELD_SOLID",
    icon: "FFFFFFFFFFFFFFFF",
  },
  {
    key: "top",
    color: "#2828FAFF",
    mask: COLLISION_ALL,
    flag: COLLISION_TOP,
    name: "FIELD_COLLISION_TOP",
    icon: "FFFFFF0000000000",
    multi: true,
  },
  {
    key: "bottom",
    color: "#FFFA28FF",
    mask: COLLISION_ALL,
    flag: COLLISION_BOTTOM,
    name: "FIELD_COLLISION_BOTTOM",
    icon: "0000000000FFFFFF",
    multi: true,
  },
  {
    key: "left",
    color: "#FA28FAFF",
    mask: COLLISION_ALL,
    flag: COLLISION_LEFT,
    name: "FIELD_COLLISION_LEFT",
    icon: "E0E0E0E0E0E0E0E0",
    multi: true,
  },
  {
    key: "right",
    color: "#28FAFAFF",
    mask: COLLISION_ALL,
    flag: COLLISION_RIGHT,
    name: "FIELD_COLLISION_RIGHT",
    icon: "0707070707070707",
    multi: true,
  },
  {
    key: "ladder",
    color: "#008000FF",
    mask: TILE_PROPS,
    flag: TILE_PROP_LADDER,
    name: "FIELD_LADDER",
    icon: "C3FFFFC3C3FFFFC3",
    group: "prop",
  },
  {
    key: "slope_45_right",
    color: "#0000FFFF",
    mask: TILE_PROPS,
    flag: COLLISION_SLOPE_45_RIGHT,
    name: "FIELD_COLLISION_SLOPE_45_RIGHT",
    icon: "0103070F1F3F7FFF",
    extra: COLLISION_BOTTOM | COLLISION_RIGHT,
    group: "slope",
  },
  {
    key: "slope_45_left",
    color: "#0000FFFF",
    mask: TILE_PROPS,
    flag: COLLISION_SLOPE_45_LEFT,
    name: "FIELD_COLLISION_SLOPE_45_LEFT",
    icon: "80C0E0F0F8FCFEFF",
    extra: COLLISION_BOTTOM | COLLISION_LEFT,
    group: "slope",
  },
  {
    key: "slope_22_right_bot",
    color: "#0000FFFF",
    mask: TILE_PROPS,
    flag: COLLISION_SLOPE_22_RIGHT_BOT,
    name: "FIELD_COLLISION_SLOPE_22_RIGHT_BOT",
    icon: "00000000030F3FFF",
    extra: COLLISION_BOTTOM,
    group: "slope",
  },
  {
    key: "slope_22_right_top",
    color: "#0000FFFF",
    mask: TILE_PROPS,
    flag: COLLISION_SLOPE_22_RIGHT_TOP,
    name: "FIELD_COLLISION_SLOPE_22_RIGHT_TOP",
    icon: "030F3FFF00000000",
    extra: COLLISION_BOTTOM | COLLISION_RIGHT,
    group: "slope",
  },
  {
    key: "slope_22_left_top",
    color: "#0000FFFF",
    mask: TILE_PROPS,
    flag: COLLISION_SLOPE_22_LEFT_TOP,
    name: "FIELD_COLLISION_SLOPE_22_LEFT_TOP",
    icon: "C0F0FCFF00000000",
    extra: COLLISION_BOTTOM | COLLISION_LEFT,
    group: "slope",
  },
  {
    key: "slope_22_left_bot",
    color: "#0000FFFF",
    mask: TILE_PROPS,
    flag: COLLISION_SLOPE_22_LEFT_BOT,
    name: "FIELD_COLLISION_SLOPE_22_LEFT_BOT",
    icon: "00000000C0F0FCFF",
    extra: COLLISION_BOTTOM,
    group: "slope",
  },
  {
    key: "spare_08",
    color: "#00800080",
    mask: TILE_PROPS,
    flag: 0x80,
    name: "FIELD_COLLISION_SPARE",
    icon: "FFFFC399C399C3FF",
    group: "spare",
  },
  {
    key: "spare_09",
    color: "#00800080",
    mask: TILE_PROPS,
    flag: 0x90,
    name: "FIELD_COLLISION_SPARE",
    icon: "FFFFC399C1F9C3FF",
    group: "spare",
  },
  {
    key: "spare_10",
    color: "#80000080",
    mask: TILE_PROPS,
    flag: 0xa0,
    name: "FIELD_COLLISION_SPARE",
    icon: "FFFFC399819999FF",
    group: "spare",
  },
  {
    key: "spare_11",
    color: "#80000080",
    mask: TILE_PROPS,
    flag: 0xb0,
    name: "FIELD_COLLISION_SPARE",
    icon: "FFFF8399839983FF",
    group: "spare",
  },
  {
    key: "spare_12",
    color: "#00008080",
    mask: TILE_PROPS,
    flag: 0xc0,
    name: "FIELD_COLLISION_SPARE",
    icon: "FFFFC3999F99C3FF",
    group: "spare",
  },
  {
    key: "spare_13",
    color: "#00008080",
    mask: TILE_PROPS,
    flag: 0xd0,
    name: "FIELD_COLLISION_SPARE",
    icon: "FFFF8399999983FF",
    group: "spare",
  },
  {
    key: "spare_14",
    color: "#80008080",
    mask: TILE_PROPS,
    flag: 0xe0,
    name: "FIELD_COLLISION_SPARE",
    icon: "FFFF819F879F81FF",
    group: "spare",
  },
  {
    key: "spare_15",
    color: "#80008080",
    mask: TILE_PROPS,
    flag: 0xf0,
    name: "FIELD_COLLISION_SPARE",
    icon: "FFFF819F879F9FFF",
    group: "spare",
  },
];

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
  showCollisionTileValues: false,
  collisionLayerOpacity: 50,
  worldScrollX: 0,
  worldScrollY: 0,
  zoom: 100,
  sgbEnabled: false,
  customHead: "",
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
  colorCorrection: "default",
  previewAsMono: false,
  openBuildLogOnWarnings: true,
  generateDebugFilesEnabled: false,
  compilerPreset: 3000,
  scriptEventPresets: {},
  scriptEventDefaultPresets: {},
  runSceneSelectionOnly: false,
  spriteMode: "8x16",
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
