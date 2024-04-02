import {
  SceneNormalized,
  Background,
  SpriteSheet,
  Music,
  ActorNormalized,
  TriggerNormalized,
  Palette,
  CustomEventNormalized,
  Scene,
} from "../src/shared/lib/entities/entitiesTypes";
import { ProjectData } from "../src/store/features/project/projectActions";
import { RootState } from "../src/store/configureStore";
import { initialState as initialEditorState } from "../src/store/features/editor/editorState";
import { initialState as initialConsoleState } from "../src/store/features/console/consoleState";
import { initialState as initialMetadataState } from "../src/store/features/metadata/metadataState";
import { initialState as initialEntitiesState } from "../src/store/features/entities/entitiesState";
import { initialState as initialSettingsState } from "../src/store/features/settings/settingsState";
import { initialState as initialMusicState } from "../src/store/features/music/musicState";
import { initialState as initialNavigationState } from "../src/store/features/navigation/navigationState";
import { initialState as initialDocumentState } from "../src/store/features/document/documentState";
import { initialState as initialErrorState } from "../src/store/features/error/errorState";
import { initialState as initialAssetsState } from "../src/store/features/assets/assetsState";
import { initialState as initialEngineState } from "../src/store/features/engine/engineState";
import { initialState as initialClipboardState } from "../src/store/features/clipboard/clipboardState";
import { initialState as initialSpriteState } from "../src/store/features/sprite/spriteState";
import { initialState as initialScriptEventDefsState } from "../src/store/features/scriptEventDefs/scriptEventDefsState";
import { initialState as initialTrackerState } from "../src/store/features/tracker/trackerState";
import { initialState as initialTrackerDocumentState } from "../src/store/features/trackerDocument/trackerDocumentState";
import { initialState as initialDebuggerState } from "../src/store/features/debugger/debuggerState";
import compileFonts, {
  PrecompiledFontData,
} from "../src/lib/compiler/compileFonts";
import { projectTemplatesRoot } from "../src/consts";
import {
  PrecompiledBackground,
  PrecompiledSprite,
} from "../src/lib/compiler/compileData2";

export const dummySceneNormalized: SceneNormalized = {
  id: "",
  name: "Scene",
  symbol: "scene_0",
  backgroundId: "",
  x: 0,
  y: 0,
  width: 20,
  height: 18,
  type: "0",
  autoFadeSpeed: 1,
  paletteIds: [],
  spritePaletteIds: [],
  collisions: [0],
  actors: [],
  triggers: [],
  script: [],
  playerHit1Script: [],
  playerHit2Script: [],
  playerHit3Script: [],
};

export const dummyScene: Scene = dummySceneNormalized as unknown as Scene;

export const dummyActorNormalized: ActorNormalized = {
  id: "dummyActor1",
  name: "",
  symbol: "actor_0",
  spriteSheetId: "",
  x: 0,
  y: 0,
  frame: 0,
  direction: "down",
  animate: false,
  paletteId: "",
  animSpeed: 3,
  moveSpeed: 1,
  isPinned: false,
  persistent: false,
  collisionGroup: "",
  script: [],
  startScript: [],
  updateScript: [],
  hit1Script: [],
  hit2Script: [],
  hit3Script: [],
};

export const dummyTriggerNormalized: TriggerNormalized = {
  id: "",
  name: "",
  symbol: "trigger_0",
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  script: [],
  leaveScript: [],
};

export const dummyPalette: Palette = {
  id: "",
  name: "",
  colors: ["", "", "", ""],
};

export const dummyPrecompiledBackground: PrecompiledBackground = {
  id: "",
  symbol: "bg_1",
  name: "",
  width: 1,
  height: 1,
  data: new Uint8Array(),
  tileset: {
    symbol: "ts_1",
    data: new Uint8Array(),
  },
  tilemap: {
    symbol: "tm_1",
    data: new Uint8Array(),
  },
  tilemapAttr: {
    symbol: "ta_1",
    data: new Uint8Array(),
  },
};

export const dummyBackground: Background = {
  id: "",
  name: "",
  symbol: "bg_0",
  filename: "",
  width: 1,
  height: 1,
  imageWidth: 1,
  imageHeight: 1,
  tileColors: [0],
  inode: "0",
  _v: 0,
};

export const dummySpriteSheet: SpriteSheet = {
  id: "",
  name: "",
  symbol: "sprite_0",
  filename: "",
  numTiles: 1,
  checksum: "",
  width: 16,
  height: 16,
  canvasWidth: 32,
  canvasHeight: 32,
  boundsX: 0,
  boundsY: 0,
  boundsWidth: 16,
  boundsHeight: 16,
  states: [],
  animSpeed: 4,
  inode: "1",
  _v: 0,
};

export const dummyPrecompiledSpriteSheet: PrecompiledSprite = {
  id: "",
  symbol: "sprite_1",
  name: "",
  filename: "",
  canvasWidth: 32,
  canvasHeight: 32,
  boundsX: 0,
  boundsY: 0,
  boundsWidth: 16,
  boundsHeight: 16,
  states: [],
  tileset: {
    symbol: "ts_1",
    data: new Uint8Array(),
  },
  data: [],
  tiles: [],
  metasprites: [],
  animationOffsets: [],
  metaspritesOrder: [],
  checksum: "",
  numTiles: 1,
  width: 32,
  height: 32,
  animSpeed: 15,
};

export const dummyMusic: Music = {
  id: "",
  name: "",
  symbol: "song_0",
  filename: "",
  inode: "2",
  _v: 0,
  settings: {},
};

export const dummyCustomEventNormalized: CustomEventNormalized = {
  id: "",
  name: "",
  symbol: "script_0",
  description: "",
  variables: {},
  actors: {},
  script: [],
};

export const dummyProjectData: ProjectData = {
  name: "",
  _version: "2.0.0",
  _release: "1",
  author: "",
  notes: "",
  scenes: [],
  backgrounds: [],
  spriteSheets: [],
  palettes: [],
  customEvents: [],
  variables: [],
  music: [],
  fonts: [],
  avatars: [],
  emotes: [],
  sounds: [],
  engineFieldValues: [],
  settings: {
    startSceneId: "",
    startX: 0,
    startY: 0,
    startMoveSpeed: 1,
    startAnimSpeed: 3,
    startDirection: "down",
    playerPaletteId: "",
    showCollisions: true,
    showConnections: true,
    worldScrollX: 0,
    worldScrollY: 0,
    zoom: 100,
    sgbEnabled: false,
    defaultBackgroundPaletteIds: ["", "", "", "", "", "", "", ""],
    defaultSpritePaletteIds: ["", "", "", "", "", "", "", ""],
    defaultSpritePaletteId: "",
    defaultUIPaletteId: "",
    customHead: "",
    navigatorSplitSizes: [300, 100, 100],
    showNavigator: true,
    defaultFontId: "",
    defaultCharacterEncoding: "",
    defaultPlayerSprites: {},
    musicDriver: "huge",
    cartType: "mbc5",
    batterylessEnabled: false,
    favoriteEvents: [],
    showCollisionSlopeTiles: false,
    showCollisionExtraTiles: false,
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
    colorMode: "mono",
  },
};

export const getDummyCompiledFont = async (): Promise<PrecompiledFontData> => {
  const compiledFontsRet = await compileFonts(
    [
      {
        id: "87d28862-ac4a-4f15-b678-d8d2e3e8787c",
        name: "gbs-mono",
        symbol: "font_0",
        width: 128,
        height: 112,
        filename: "gbs-mono.png",
        plugin: undefined,
      },
    ],
    `${projectTemplatesRoot}/gbhtml`
  );

  return compiledFontsRet[0];
};

export const dummyRootState: RootState = {
  editor: {
    ...initialEditorState,
  },
  console: {
    ...initialConsoleState,
  },
  music: {
    ...initialMusicState,
  },
  navigation: {
    ...initialNavigationState,
  },
  document: {
    ...initialDocumentState,
  },
  error: {
    ...initialErrorState,
  },
  assets: {
    ...initialAssetsState,
  },
  engine: {
    ...initialEngineState,
  },
  clipboard: {
    ...initialClipboardState,
  },
  sprite: {
    ...initialSpriteState,
  },
  scriptEventDefs: {
    ...initialScriptEventDefsState,
  },
  tracker: {
    ...initialTrackerState,
  },
  debug: {
    ...initialDebuggerState,
  },
  trackerDocument: {
    past: [],
    future: [],
    present: {
      ...initialTrackerDocumentState,
    },
  },
  project: {
    past: [],
    future: [],
    present: {
      entities: {
        ...initialEntitiesState,
      },
      settings: {
        ...initialSettingsState,
      },
      metadata: {
        ...initialMetadataState,
      },
    },
  },
};
