import {
  SceneNormalized,
  Background,
  SpriteSheetNormalized,
  Music,
  ActorNormalized,
  TriggerNormalized,
  Palette,
  CustomEventNormalized,
  Scene,
  Actor,
  Trigger,
  ActorPrefabNormalized,
  TriggerPrefabNormalized,
  Variable,
  ScriptEventNormalized,
  ScriptEvent,
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
} from "../src/lib/compiler/generateGBVMData";
import {
  ActorPrefabResource,
  ActorResource,
  AvatarResource,
  CompressedBackgroundResource,
  CompressedSceneResourceWithChildren,
  EmoteResource,
  EngineFieldValuesResource,
  FontResource,
  MusicResource,
  PaletteResource,
  ProjectResources,
  SceneResource,
  ScriptResource,
  SettingsResource,
  SoundResource,
  SpriteResource,
  TilesetResource,
  TriggerPrefabResource,
  TriggerResource,
  VariablesResource,
} from "shared/lib/resources/types";
import { compressProjectResources } from "shared/lib/resources/compression";

export const dummySceneNormalized: SceneNormalized = {
  id: "",
  name: "Scene",
  symbol: "scene_0",
  backgroundId: "",
  tilesetId: "",
  x: 0,
  y: 0,
  width: 20,
  height: 18,
  type: "0",
  autoFadeSpeed: 1,
  colorModeOverride: "none",
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

export const dummySceneResource: SceneResource = {
  _resourceType: "scene",
  ...dummySceneNormalized,
} as unknown as SceneResource;

export const dummyCompressedSceneResource: CompressedSceneResourceWithChildren =
  {
    _resourceType: "scene",
    ...dummySceneNormalized,
    collisions: "",
  } as unknown as CompressedSceneResourceWithChildren;

export const dummyScriptEvent: ScriptEvent = {
  id: "event1",
  command: "CMD",
  args: {},
};

export const dummyScriptEventNormalized: ScriptEventNormalized = {
  id: "event1",
  command: "CMD",
  args: {},
};

export const dummyActorNormalized: ActorNormalized = {
  id: "dummyActor1",
  name: "",
  symbol: "actor_0",
  spriteSheetId: "",
  prefabId: "",
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
  collisionExtraFlags: [],
  prefabScriptOverrides: {},
  script: [],
  startScript: [],
  updateScript: [],
  hit1Script: [],
  hit2Script: [],
  hit3Script: [],
};

export const dummyActor: Actor = dummyActorNormalized as unknown as Actor;

export const dummyTriggerNormalized: TriggerNormalized = {
  id: "",
  name: "",
  symbol: "trigger_0",
  prefabId: "",
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  prefabScriptOverrides: {},
  script: [],
  leaveScript: [],
};

export const dummyTrigger: Trigger =
  dummyTriggerNormalized as unknown as Trigger;

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
  colorMode: "mixed",
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

export const dummyCompressedBackgroundResource: CompressedBackgroundResource = {
  _resourceType: "background",
  ...dummyBackground,
  collisions: "",
} as unknown as CompressedBackgroundResource;

export const dummySpriteSheet: SpriteSheetNormalized = {
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
  spriteMode: "8x16",
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
  tiles: [],
  metasprites: [],
  animationOffsets: [],
  metaspritesOrder: [],
  checksum: "",
  numTiles: 1,
  width: 32,
  height: 32,
  animSpeed: 15,
  vramData: [[], []],
  colorMode: "mixed",
  spriteMode: "8x16",
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
  constants: [],
  music: [],
  fonts: [],
  avatars: [],
  emotes: [],
  sounds: [],
  tilesets: [],
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
    collisionLayerOpacity: 50,
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
    showCollisionTileValues: false,
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
    colorCorrection: "default",
    previewAsMono: false,
    openBuildLogOnWarnings: true,
    generateDebugFilesEnabled: false,
    compilerPreset: 3000,
    scriptEventPresets: {},
    scriptEventDefaultPresets: {},
    runSceneSelectionOnly: false,
    spriteMode: "8x16",
  },
};

export const dummyActorResource: ActorResource = {
  _resourceType: "actor",
  _index: 0,
  id: "actor1",
  symbol: "symbol",
  prefabId: "",
  name: "Actor 1",
  x: 10,
  y: 20,
  frame: 0,
  animate: true,
  spriteSheetId: "sprite1",
  paletteId: "palette1",
  direction: "down",
  moveSpeed: 1,
  animSpeed: 15,
  isPinned: false,
  persistent: true,
  collisionGroup: "",
  collisionExtraFlags: [],
  prefabScriptOverrides: {},
  script: [],
  startScript: [],
  updateScript: [],
  hit1Script: [],
  hit2Script: [],
  hit3Script: [],
};

export const dummyTriggerResource: TriggerResource = {
  _resourceType: "trigger",
  _index: 0,
  id: "trigger1",
  symbol: "symbol",
  name: "Trigger 1",
  prefabId: "",
  x: 10,
  y: 20,
  width: 30,
  height: 40,
  prefabScriptOverrides: {},
  script: [],
  leaveScript: [],
};

export const dummyBackgroundResource: CompressedBackgroundResource = {
  _resourceType: "background",
  id: "bg1",
  name: "Background 1",
  symbol: "symbol",
  filename: "background.png",
  width: 256,
  height: 256,
  imageWidth: 256,
  imageHeight: 256,
  tileColors: "colors",
};

export const dummySpriteResource: SpriteResource = {
  _resourceType: "sprite",
  id: "sprite1",
  name: "Sprite 1",
  symbol: "symbol",
  filename: "sprite.png",
  numTiles: 16,
  checksum: "checksum",
  width: 16,
  height: 16,
  canvasWidth: 16,
  canvasHeight: 16,
  boundsX: 0,
  boundsY: 0,
  boundsWidth: 16,
  boundsHeight: 16,
  animSpeed: null,
  states: [],
  spriteMode: "8x16",
};

export const dummyPaletteResource: PaletteResource = {
  _resourceType: "palette",
  id: "palette1",
  name: "Palette 1",
  colors: ["#FFFFFF", "#AAAAAA", "#555555", "#000000"],
};

export const dummyScriptResource: ScriptResource = {
  _resourceType: "script",
  id: "script1",
  name: "Script 1",
  symbol: "symbol",
  description: "Description",
  variables: {
    var1: { id: "var1", name: "Variable 1", passByReference: false },
  },
  actors: { actor1: { id: "actor1", name: "Actor 1" } },
  script: [],
};

export const dummyActorPrefabResource: ActorPrefabResource = {
  _resourceType: "actorPrefab",
  script: [],
  id: "",
  name: "",
  startScript: [],
  updateScript: [],
  hit1Script: [],
  hit2Script: [],
  hit3Script: [],
  spriteSheetId: "",
  paletteId: "",
  frame: 0,
  moveSpeed: 0,
  animSpeed: 0,
  animate: false,
  persistent: false,
  collisionGroup: "",
  collisionExtraFlags: [],
};

export const dummyActorPrefabNormalized: ActorPrefabNormalized =
  dummyActorPrefabResource as unknown as ActorPrefabNormalized;

export const dummyTriggerPrefabResource: TriggerPrefabResource = {
  script: [],
  id: "",
  name: "",
  _resourceType: "triggerPrefab",
  leaveScript: [],
};

export const dummyTriggerPrefabNormalized: TriggerPrefabNormalized =
  dummyTriggerPrefabResource as unknown as TriggerPrefabNormalized;

export const dummyMusicResource: MusicResource = {
  _resourceType: "music",
  id: "music1",
  name: "Music 1",
  symbol: "symbol",
  filename: "music.mp3",
  settings: {},
};

export const dummySoundResource: SoundResource = {
  _resourceType: "sound",
  id: "sound1",
  name: "Sound 1",
  symbol: "symbol",
  filename: "sound.wav",
  type: "wav",
};

export const dummyEmoteResource: EmoteResource = {
  _resourceType: "emote",
  id: "emote1",
  name: "Emote 1",
  symbol: "symbol",
  filename: "emote.png",
  width: 16,
  height: 16,
};

export const dummyAvatarResource: AvatarResource = {
  _resourceType: "avatar",
  id: "avatar1",
  name: "Avatar 1",
  filename: "avatar.png",
  width: 16,
  height: 16,
};

export const dummyTilesetResource: TilesetResource = {
  _resourceType: "tileset",
  id: "tileset1",
  name: "Tileset 1",
  symbol: "symbol",
  filename: "tileset.png",
  width: 256,
  height: 256,
  imageWidth: 256,
  imageHeight: 256,
};

export const dummyFontResource: FontResource = {
  _resourceType: "font",
  id: "font1",
  name: "Font 1",
  symbol: "symbol",
  filename: "font.png",
  width: 16,
  height: 16,
  mapping: {},
};

export const dummySettingsResource: SettingsResource = {
  _resourceType: "settings",
  startSceneId: "scene1",
  startX: 10,
  startY: 20,
  startMoveSpeed: 1,
  startAnimSpeed: null,
  startDirection: "down",
  showCollisions: true,
  showConnections: "all",
  showCollisionSlopeTiles: true,
  showCollisionExtraTiles: true,
  showCollisionTileValues: false,
  collisionLayerOpacity: 50,
  worldScrollX: 0,
  worldScrollY: 0,
  zoom: 1,
  sgbEnabled: false,
  customHead: "head",
  defaultBackgroundPaletteIds: [
    "palette1",
    "palette2",
    "palette3",
    "palette4",
    "palette5",
    "palette6",
    "palette7",
    "palette8",
  ],
  defaultSpritePaletteIds: [
    "spritePalette1",
    "spritePalette2",
    "spritePalette3",
    "spritePalette4",
    "spritePalette5",
    "spritePalette6",
    "spritePalette7",
    "spritePalette8",
  ],
  defaultSpritePaletteId: "spritePalette1",
  defaultUIPaletteId: "uiPalette",
  playerPaletteId: "playerPalette",
  navigatorSplitSizes: [200, 300],
  showNavigator: true,
  defaultFontId: "font1",
  defaultCharacterEncoding: "utf-8",
  defaultPlayerSprites: { player1: "sprite1" },
  musicDriver: "huge",
  cartType: "mbc5",
  batterylessEnabled: false,
  favoriteEvents: [],
  customColorsWhite: "#FFFFFF",
  customColorsLight: "#AAAAAA",
  customColorsDark: "#555555",
  customColorsBlack: "#000000",
  customControlsUp: [],
  customControlsDown: [],
  customControlsLeft: [],
  customControlsRight: [],
  customControlsA: [],
  customControlsB: [],
  customControlsStart: [],
  customControlsSelect: [],
  debuggerEnabled: false,
  debuggerScriptType: "editor",
  debuggerVariablesFilter: "all",
  debuggerCollapsedPanes: [],
  debuggerPauseOnScriptChanged: false,
  debuggerPauseOnWatchedVariableChanged: false,
  debuggerBreakpoints: [],
  debuggerWatchedVariables: [],
  colorMode: "mono",
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

export const dummyVariablesResource: VariablesResource = {
  _resourceType: "variables",
  variables: [{ id: "var1", name: "Variable 1", symbol: "symbol" }],
  constants: [],
};

export const dummyVariable: Variable = {
  id: "var1",
  name: "Variable 1",
  symbol: "symbol",
};

export const dummyEngineFieldValuesResource: EngineFieldValuesResource = {
  _resourceType: "engineFieldValues",
  engineFieldValues: [{ id: "field1", value: "someValue" }],
};

export const dummyProjectResources: ProjectResources = {
  metadata: {
    _resourceType: "project",
    name: "",
    _version: "2.0.0",
    _release: "1",
    author: "",
    notes: "",
  },
  scenes: [],
  backgrounds: [],
  sprites: [],
  palettes: [],
  actorPrefabs: [],
  triggerPrefabs: [],
  scripts: [],
  variables: {
    _resourceType: "variables",
    variables: [],
    constants: [],
  },
  music: [],
  fonts: [],
  avatars: [],
  emotes: [],
  sounds: [],
  tilesets: [],
  engineFieldValues: {
    _resourceType: "engineFieldValues",
    engineFieldValues: [],
  },
  settings: {
    _resourceType: "settings",
    startSceneId: "",
    startX: 0,
    startY: 0,
    startMoveSpeed: 1,
    startAnimSpeed: 3,
    startDirection: "down",
    playerPaletteId: "",
    showCollisions: true,
    showConnections: true,
    collisionLayerOpacity: 50,
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
    showCollisionTileValues: false,
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
    colorCorrection: "default",
    previewAsMono: false,
    openBuildLogOnWarnings: true,
    generateDebugFilesEnabled: false,
    compilerPreset: 3000,
    scriptEventPresets: {},
    scriptEventDefaultPresets: {},
    runSceneSelectionOnly: false,
    spriteMode: "8x16",
  },
};

export const dummyCompressedProjectResources = compressProjectResources(
  dummyProjectResources,
);

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
    `${projectTemplatesRoot}/gbhtml`,
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
