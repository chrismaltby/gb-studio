import { Type, Static } from "@sinclair/typebox";

export type ExtractResource<T> = Omit<T, "_resourceType">;

export const ActorDirection = Type.Union(
  [
    Type.Literal("up"),
    Type.Literal("down"),
    Type.Literal("left"),
    Type.Literal("right"),
  ],
  { default: "down" },
);

export type ActorDirection = Static<typeof ActorDirection>;

export const SceneParallaxLayer = Type.Object({
  height: Type.Number(),
  speed: Type.Number(),
});

export type SceneParallaxLayer = Static<typeof SceneParallaxLayer>;

export const SceneBoundsRect = Type.Object({
  x: Type.Number(),
  y: Type.Number(),
  width: Type.Number(),
  height: Type.Number(),
});

export type SceneBoundsRect = Static<typeof SceneBoundsRect>;

export const CollisionGroup = Type.Union(
  [
    Type.Literal(""),
    Type.Literal("1"),
    Type.Literal("2"),
    Type.Literal("3"),
    Type.Literal("player"),
  ],
  { default: "" },
);

export type CollisionGroup = Static<typeof CollisionGroup>;

export const CollisionExtraFlag = Type.Union(
  [
    Type.Literal("1"),
    Type.Literal("2"),
    Type.Literal("3"),
    Type.Literal("4"),
    Type.Literal("solid"),
    Type.Literal("platform"),
  ],
  { default: "" },
);

export type CollisionExtraFlag = Static<typeof CollisionExtraFlag>;

export const ColorModeSetting = Type.Union([
  Type.Literal("mono"),
  Type.Literal("mixed"),
  Type.Literal("color"),
]);

export type ColorModeSetting = Static<typeof ColorModeSetting>;

export const ColorModeOverrideSetting = Type.Union([
  Type.Literal("none"),
  Type.Literal("mixed"),
  Type.Literal("color"),
]);

export type ColorModeOverrideSetting = Static<typeof ColorModeOverrideSetting>;

export const MinimalResource = Type.Object({
  _resourceType: Type.String(),
});

export type MinimalResource = Static<typeof MinimalResource>;

const MetadataResource = Type.Object({
  _resourceType: Type.Literal("project"),
  name: Type.String(),
  author: Type.String(),
  notes: Type.String(),
  _version: Type.String(),
  _release: Type.String(),
});

export type MetadataResource = Static<typeof MetadataResource>;

export const ScriptEventArgs = Type.Record(Type.String(), Type.Unknown());

export type ScriptEventArgs = Static<typeof ScriptEventArgs>;

const ScriptEvent = Type.Recursive((This) =>
  Type.Object({
    id: Type.String(),
    command: Type.String(),
    args: Type.Optional(ScriptEventArgs), // Matches ScriptEventArgs
    children: Type.Optional(
      Type.Record(
        Type.String(),
        Type.Union([Type.Array(This), Type.Undefined()]),
      ),
    ),
  }),
);
type ScriptEvent = Static<typeof ScriptEvent>;

const ScriptEventArgsOverride = Type.Object({
  id: Type.String(),
  args: Type.Record(Type.String(), Type.Unknown()),
});

type ScriptEventArgsOverride = Static<typeof ScriptEventArgsOverride>;

export const ActorResource = Type.Object({
  _resourceType: Type.Literal("actor"),
  _index: Type.Number(),
  id: Type.String(),
  symbol: Type.String(),
  prefabId: Type.String(),
  name: Type.String(),
  x: Type.Number(),
  y: Type.Number(),
  frame: Type.Number(),
  animate: Type.Boolean(),
  spriteSheetId: Type.String(),
  paletteId: Type.String(),
  direction: ActorDirection,
  moveSpeed: Type.Number({ default: 1 }),
  animSpeed: Type.Number({ default: 15 }),
  isPinned: Type.Boolean(),
  persistent: Type.Boolean(),
  collisionGroup: CollisionGroup,
  collisionExtraFlags: Type.Array(CollisionExtraFlag),
  prefabScriptOverrides: Type.Record(Type.String(), ScriptEventArgsOverride),
  script: Type.Array(ScriptEvent),
  startScript: Type.Array(ScriptEvent),
  updateScript: Type.Array(ScriptEvent),
  hit1Script: Type.Array(ScriptEvent),
  hit2Script: Type.Array(ScriptEvent),
  hit3Script: Type.Array(ScriptEvent),
});

export type ActorResource = Static<typeof ActorResource>;

export const ActorPrefabResource = Type.Composite([
  Type.Omit(ActorResource, [
    "_resourceType",
    "_index",
    "prefabId",
    "x",
    "y",
    "direction",
    "isPinned",
    "symbol",
    "prefabScriptOverrides",
  ]),
  Type.Object({
    _resourceType: Type.Literal("actorPrefab"),
  }),
]);

export type ActorPrefabResource = Static<typeof ActorPrefabResource>;

export const TriggerResource = Type.Object({
  _resourceType: Type.Literal("trigger"),
  _index: Type.Number(),
  id: Type.String(),
  symbol: Type.String(),
  prefabId: Type.String(),
  name: Type.String(),
  x: Type.Number(),
  y: Type.Number(),
  width: Type.Number(),
  height: Type.Number(),
  prefabScriptOverrides: Type.Record(Type.String(), ScriptEventArgsOverride),
  script: Type.Array(ScriptEvent),
  leaveScript: Type.Array(ScriptEvent),
});

export type TriggerResource = Static<typeof TriggerResource>;

export const TriggerPrefabResource = Type.Composite([
  Type.Omit(TriggerResource, [
    "_resourceType",
    "_index",
    "prefabId",
    "x",
    "y",
    "width",
    "height",
    "symbol",
    "prefabScriptOverrides",
  ]),
  Type.Object({
    _resourceType: Type.Literal("triggerPrefab"),
  }),
]);

export type TriggerPrefabResource = Static<typeof TriggerPrefabResource>;

export const CompressedSceneResource = Type.Object({
  _resourceType: Type.Literal("scene"),
  _index: Type.Number(),
  id: Type.String(),
  type: Type.String(),
  name: Type.String(),
  symbol: Type.String(),
  notes: Type.Optional(Type.String()),
  labelColor: Type.Optional(Type.String()),
  x: Type.Number(),
  y: Type.Number(),
  width: Type.Number(),
  height: Type.Number(),
  backgroundId: Type.String(),
  tilesetId: Type.String(),
  colorModeOverride: ColorModeOverrideSetting,
  paletteIds: Type.Array(Type.String()),
  spritePaletteIds: Type.Array(Type.String()),
  autoFadeSpeed: Type.Union([Type.Number(), Type.Null()], { default: 1 }),
  autoFadeEventCollapse: Type.Optional(Type.Boolean()),
  parallax: Type.Optional(Type.Array(SceneParallaxLayer)),
  playerSpriteSheetId: Type.Optional(Type.String()),
  script: Type.Array(ScriptEvent),
  playerHit1Script: Type.Array(ScriptEvent),
  playerHit2Script: Type.Array(ScriptEvent),
  playerHit3Script: Type.Array(ScriptEvent),
  collisions: Type.String(),
  scrollBounds: Type.Optional(Type.Object({
    x: Type.Number(),
    y: Type.Number(),
    width: Type.Number(),
    height: Type.Number(),
  })),
});

export type CompressedSceneResource = Static<typeof CompressedSceneResource>;

export const ProjectMetadataResource = Type.Object({
  _resourceType: Type.Literal("project"),
  name: Type.String(),
  author: Type.String(),
  notes: Type.String(),
  _version: Type.String(),
  _release: Type.String(),
});

export type ProjectMetadataResource = Static<typeof ProjectMetadataResource>;

export const CompressedSceneResourceWithChildren = Type.Composite([
  CompressedSceneResource,
  Type.Object({
    actors: Type.Array(ActorResource),
    triggers: Type.Array(TriggerResource),
  }),
]);

export type CompressedSceneResourceWithChildren = Static<
  typeof CompressedSceneResourceWithChildren
>;

export const SceneResource = Type.Composite([
  Type.Omit(CompressedSceneResourceWithChildren, ["collisions"]),
  Type.Object({
    collisions: Type.Array(Type.Number()),
  }),
]);

export type SceneResource = Static<typeof SceneResource>;

export const ScriptVariable = Type.Object({
  id: Type.String(),
  name: Type.String(),
  passByReference: Type.Boolean(),
});

export type ScriptVariable = Static<typeof ScriptVariable>;

export const ScriptActor = Type.Object({
  id: Type.String(),
  name: Type.String(),
});

export type ScriptActor = Static<typeof ScriptActor>;

export const ScriptResource = Type.Object({
  _resourceType: Type.Literal("script"),
  id: Type.String(),
  name: Type.String(),
  symbol: Type.String(),
  description: Type.String(),
  variables: Type.Record(Type.String(), ScriptVariable),
  actors: Type.Record(Type.String(), ScriptActor),
  script: Type.Array(ScriptEvent),
});

export type ScriptResource = Static<typeof ScriptResource>;

export const CompressedBackgroundResource = Type.Object({
  _resourceType: Type.Literal("background"),
  id: Type.String(),
  name: Type.String(),
  symbol: Type.String(),
  filename: Type.String(),
  width: Type.Number(),
  height: Type.Number(),
  imageWidth: Type.Number(),
  imageHeight: Type.Number(),
  monoOverrideId: Type.Optional(Type.String()),
  autoColor: Type.Optional(Type.Boolean()),
  plugin: Type.Optional(Type.String()),
  tileColors: Type.String(),
});

export type CompressedBackgroundResource = Static<
  typeof CompressedBackgroundResource
>;

export type CompressedBackgroundResourceAsset = CompressedBackgroundResource &
  AssetMetadata;

export const BackgroundResource = Type.Composite([
  Type.Omit(CompressedBackgroundResource, ["tileColors"]),
  Type.Object({
    tileColors: Type.Array(Type.Number()),
  }),
]);

export type BackgroundResource = Static<typeof BackgroundResource>;

export const TilesetResource = Type.Object({
  _resourceType: Type.Literal("tileset"),
  id: Type.String(),
  name: Type.String(),
  symbol: Type.String(),
  filename: Type.String(),
  width: Type.Number(),
  height: Type.Number(),
  imageWidth: Type.Number(),
  imageHeight: Type.Number(),
  plugin: Type.Optional(Type.String()),
});

export type TilesetResource = Static<typeof TilesetResource>;

export type TilesetResourceAsset = TilesetResource & AssetMetadata;

export const ObjPalette = Type.Union([
  Type.Literal("OBP0"),
  Type.Literal("OBP1"),
]);

export type ObjPalette = Static<typeof ObjPalette>;

export const SpriteModeSetting = Type.Union([
  Type.Literal("8x8"),
  Type.Literal("8x16"),
]);

export type SpriteModeSetting = Static<typeof SpriteModeSetting>;

export const MetaspriteTile = Type.Object({
  id: Type.String(),
  x: Type.Number(),
  y: Type.Number(),
  sliceX: Type.Number(),
  sliceY: Type.Number(),
  palette: Type.Number(),
  flipX: Type.Boolean(),
  flipY: Type.Boolean(),
  objPalette: ObjPalette,
  paletteIndex: Type.Number(),
  priority: Type.Boolean(),
});

export const Metasprite = Type.Object({
  id: Type.String(),
  tiles: Type.Array(MetaspriteTile),
});

export const SpriteAnimationType = Type.Union([
  Type.Literal("fixed"),
  Type.Literal("fixed_movement"),
  Type.Literal("multi"),
  Type.Literal("multi_movement"),
  Type.Literal("horizontal"),
  Type.Literal("horizontal_movement"),
  Type.Literal("platform_player"),
  Type.Literal("cursor"),
]);

export type SpriteAnimationType = Static<typeof SpriteAnimationType>;

export const SpriteAnimation = Type.Object({
  id: Type.String(),
  frames: Type.Array(Metasprite),
});

export type SpriteAnimation = Static<typeof SpriteAnimation>;

export const SpriteState = Type.Object({
  id: Type.String(),
  name: Type.String(),
  animationType: SpriteAnimationType,
  flipLeft: Type.Boolean(),
  animations: Type.Array(SpriteAnimation),
});

export const SpriteResource = Type.Object({
  _resourceType: Type.Literal("sprite"),
  id: Type.String(),
  name: Type.String(),
  symbol: Type.String(),
  filename: Type.String(),
  numTiles: Type.Number(),
  plugin: Type.Optional(Type.String()),
  checksum: Type.String(),
  width: Type.Number(),
  height: Type.Number(),
  canvasWidth: Type.Number(),
  canvasHeight: Type.Number(),
  boundsX: Type.Number(),
  boundsY: Type.Number(),
  boundsWidth: Type.Number(),
  boundsHeight: Type.Number(),
  animSpeed: Type.Union([Type.Number(), Type.Null()]),
  states: Type.Array(SpriteState),
  spriteMode: Type.Optional(SpriteModeSetting),
});

export type SpriteResource = Static<typeof SpriteResource>;

export const AssetMetadata = Type.Object({
  _v: Type.Number(),
  inode: Type.String(),
});

export type AssetMetadata = Static<typeof AssetMetadata>;

export type SpriteResourceAsset = SpriteResource & AssetMetadata;

export const EmoteResource = Type.Object({
  _resourceType: Type.Literal("emote"),
  id: Type.String(),
  name: Type.String(),
  symbol: Type.String(),
  filename: Type.String(),
  width: Type.Number(),
  height: Type.Number(),
  plugin: Type.Optional(Type.String()),
});

export type EmoteResource = Static<typeof EmoteResource>;

export type EmoteResourceAsset = EmoteResource & AssetMetadata;

export const AvatarResource = Type.Object({
  _resourceType: Type.Literal("avatar"),
  id: Type.String(),
  name: Type.String(),
  filename: Type.String(),
  width: Type.Number(),
  height: Type.Number(),
  plugin: Type.Optional(Type.String()),
});

export type AvatarResource = Static<typeof AvatarResource>;

export type AvatarResourceAsset = AvatarResource & AssetMetadata;

export const FontResource = Type.Object({
  _resourceType: Type.Literal("font"),
  id: Type.String(),
  name: Type.String(),
  symbol: Type.String(),
  filename: Type.String(),
  width: Type.Number(),
  height: Type.Number(),
  plugin: Type.Optional(Type.String()),
  mapping: Type.Record(
    Type.String(),
    Type.Union([Type.Number(), Type.Array(Type.Number())]),
  ),
});

export type FontResource = Static<typeof FontResource>;

export type FontResourceAsset = FontResource & AssetMetadata;

export const SoundType = Type.Union([
  Type.Literal("wav"),
  Type.Literal("vgm"),
  Type.Literal("fxhammer"),
]);

export const SoundResource = Type.Object({
  _resourceType: Type.Literal("sound"),
  id: Type.String(),
  name: Type.String(),
  symbol: Type.String(),
  filename: Type.String(),
  plugin: Type.Optional(Type.String()),
  type: SoundType,
  numEffects: Type.Optional(Type.Number()),
});

export type SoundResource = Static<typeof SoundResource>;

export type SoundResourceAsset = SoundResource & AssetMetadata;

export const MusicSettings = Type.Object({
  disableSpeedConversion: Type.Optional(Type.Boolean()),
});

export const MusicResource = Type.Object({
  _resourceType: Type.Literal("music"),
  id: Type.String(),
  name: Type.String(),
  symbol: Type.String(),
  filename: Type.String(),
  plugin: Type.Optional(Type.String()),
  settings: MusicSettings,
  type: Type.Optional(Type.String()),
});

export type MusicResource = Static<typeof MusicResource>;

export type MusicResourceAsset = MusicResource & AssetMetadata;

export const PaletteResource = Type.Object({
  _resourceType: Type.Literal("palette"),
  id: Type.String(),
  name: Type.String(),
  colors: Type.Tuple([
    Type.String(),
    Type.String(),
    Type.String(),
    Type.String(),
  ]),
  defaultName: Type.Optional(Type.String()),
  defaultColors: Type.Optional(
    Type.Tuple([Type.String(), Type.String(), Type.String(), Type.String()]),
  ),
});

export type PaletteResource = Static<typeof PaletteResource>;

export const ColorCorrectionSetting = Type.Union([
  Type.Literal("none"),
  Type.Literal("default"),
]);

export type ColorCorrectionSetting = Static<typeof ColorCorrectionSetting>;

export const ShowConnectionsSetting = Type.Union([
  Type.Literal("all"),
  Type.Literal("selected"),
  Type.Literal(true),
  Type.Literal(false),
]);

export type ShowConnectionsSetting = Static<typeof ShowConnectionsSetting>;

export const MusicDriverSetting = Type.Union([
  Type.Literal("huge"),
  Type.Literal("gbt"),
]);

export type MusicDriverSetting = Static<typeof MusicDriverSetting>;

export const CartType = Type.Union([
  Type.Literal("mbc5"),
  Type.Literal("mbc3"),
]);

export type CartType = Static<typeof CartType>;

export const ScriptEditorCtxType = Type.Union([
  Type.Literal("entity"),
  Type.Literal("script"),
  Type.Literal("prefab"),
  Type.Literal("global"),
]);

export type ScriptEditorCtxType = Static<typeof ScriptEditorCtxType>;

export const EntityType = Type.Union([
  Type.Literal("scene"),
  Type.Literal("actor"),
  Type.Literal("trigger"),
  Type.Literal("customEvent"),
  Type.Literal("actorPrefab"),
  Type.Literal("triggerPrefab"),
]);

export const DebuggerScriptType = Type.Union([
  Type.Literal("editor"),
  Type.Literal("gbvm"),
]);

export type DebuggerScriptType = Static<typeof DebuggerScriptType>;

export const DebuggerVariablesFilterType = Type.Union([
  Type.Literal("all"),
  Type.Literal("watched"),
]);

export type DebuggerVariablesFilterType = Static<
  typeof DebuggerVariablesFilterType
>;

export type EntityType = Static<typeof EntityType>;

export const ScriptEditorCtx = Type.Object({
  type: ScriptEditorCtxType,
  sceneId: Type.String(),
  entityId: Type.String(),
  entityType: EntityType,
  scriptKey: Type.String(),
  executingId: Type.Optional(Type.String()),
});

export type ScriptEditorCtx = Static<typeof ScriptEditorCtx>;

export const BreakpointData = Type.Object({
  scriptEventId: Type.String(),
  context: ScriptEditorCtx,
});

export type BreakpointData = Static<typeof BreakpointData>;

export const ScriptEventPreset = Type.Object({
  id: Type.String(),
  name: Type.String(),
  groups: Type.Array(Type.String()),
  args: ScriptEventArgs,
});

export type ScriptEventPreset = Static<typeof ScriptEventPreset>;

export const CollisionTileDef = Type.Object({
  key: Type.String(),
  name: Type.Optional(Type.String()),
  color: Type.String(),
  icon: Type.Optional(Type.String()),
  flag: Type.Number(),
  mask: Type.Optional(Type.Number()),
  extra: Type.Optional(Type.Number()),
  multi: Type.Optional(Type.Boolean()),
  group: Type.Optional(Type.String()),
});

export type CollisionTileDef = Static<typeof CollisionTileDef>;

export const SettingsResource = Type.Object({
  _resourceType: Type.Literal("settings"),
  startSceneId: Type.String(),
  startX: Type.Number(),
  startY: Type.Number(),
  startMoveSpeed: Type.Number(),
  startAnimSpeed: Type.Union([Type.Number(), Type.Null()]),
  startDirection: ActorDirection,
  showCollisions: Type.Boolean(),
  showConnections: ShowConnectionsSetting,
  showCollisionSlopeTiles: Type.Boolean(),
  showCollisionExtraTiles: Type.Boolean(),
  showCollisionTileValues: Type.Boolean(),
  collisionLayerOpacity: Type.Number(),
  worldScrollX: Type.Number(),
  worldScrollY: Type.Number(),
  zoom: Type.Number(),
  sgbEnabled: Type.Boolean(),
  customHead: Type.String(),
  defaultBackgroundPaletteIds: Type.Tuple([
    Type.String(),
    Type.String(),
    Type.String(),
    Type.String(),
    Type.String(),
    Type.String(),
    Type.String(),
    Type.String(),
  ]),
  defaultSpritePaletteIds: Type.Tuple([
    Type.String(),
    Type.String(),
    Type.String(),
    Type.String(),
    Type.String(),
    Type.String(),
    Type.String(),
    Type.String(),
  ]),
  defaultSpritePaletteId: Type.String(),
  defaultUIPaletteId: Type.String(),
  playerPaletteId: Type.String(),
  navigatorSplitSizes: Type.Array(Type.Number()),
  showNavigator: Type.Boolean(),
  defaultFontId: Type.String(),
  defaultCharacterEncoding: Type.String(),
  defaultPlayerSprites: Type.Record(Type.String(), Type.String()),
  musicDriver: MusicDriverSetting,
  cartType: CartType,
  batterylessEnabled: Type.Boolean(),
  favoriteEvents: Type.Array(Type.String()),
  customColorsWhite: Type.String(),
  customColorsLight: Type.String(),
  customColorsDark: Type.String(),
  customColorsBlack: Type.String(),
  customControlsUp: Type.Array(Type.String()),
  customControlsDown: Type.Array(Type.String()),
  customControlsLeft: Type.Array(Type.String()),
  customControlsRight: Type.Array(Type.String()),
  customControlsA: Type.Array(Type.String()),
  customControlsB: Type.Array(Type.String()),
  customControlsStart: Type.Array(Type.String()),
  customControlsSelect: Type.Array(Type.String()),
  debuggerEnabled: Type.Boolean(),
  debuggerScriptType: DebuggerScriptType,
  debuggerVariablesFilter: DebuggerVariablesFilterType,
  debuggerCollapsedPanes: Type.Array(Type.String()),
  debuggerPauseOnScriptChanged: Type.Boolean(),
  debuggerPauseOnWatchedVariableChanged: Type.Boolean(),
  debuggerBreakpoints: Type.Array(BreakpointData),
  debuggerWatchedVariables: Type.Array(Type.String()),
  colorMode: ColorModeSetting,
  colorCorrection: ColorCorrectionSetting,
  previewAsMono: Type.Boolean(),
  openBuildLogOnWarnings: Type.Boolean(),
  generateDebugFilesEnabled: Type.Boolean(),
  compilerPreset: Type.Number({ default: 3000 }),
  scriptEventPresets: Type.Record(
    Type.String(),
    Type.Record(Type.String(), ScriptEventPreset),
  ),
  scriptEventDefaultPresets: Type.Record(Type.String(), Type.String()),
  runSceneSelectionOnly: Type.Boolean(),
  spriteMode: SpriteModeSetting,
});

export type SettingsResource = Static<typeof SettingsResource>;

export type Settings = ExtractResource<SettingsResource>;

export const VariableData = Type.Object({
  id: Type.String(),
  name: Type.String(),
  symbol: Type.String(),
  flags: Type.Optional(Type.Record(Type.String(), Type.String())),
});

export type VariableData = Static<typeof VariableData>;

export const ConstantData = Type.Object({
  id: Type.String(),
  name: Type.String(),
  symbol: Type.String(),
  value: Type.Number(),
});

export type ConstantData = Static<typeof ConstantData>;

export type Constant = ExtractResource<ConstantData>;

export const VariablesResource = Type.Object({
  _resourceType: Type.Literal("variables"),
  variables: Type.Array(VariableData),
  constants: Type.Array(ConstantData),
});

export type VariablesResource = Static<typeof VariablesResource>;

export const EngineFieldValueData = Type.Object({
  id: Type.String(),
  value: Type.Optional(Type.Union([Type.String(), Type.Number()])),
});

export type EngineFieldValueData = Static<typeof EngineFieldValueData>;

export const EngineFieldValuesResource = Type.Object({
  _resourceType: Type.Literal("engineFieldValues"),
  engineFieldValues: Type.Array(EngineFieldValueData),
});

export type EngineFieldValuesResource = Static<
  typeof EngineFieldValuesResource
>;

export type CompressedResource =
  | CompressedSceneResourceWithChildren
  | ScriptResource
  | SpriteResource
  | CompressedBackgroundResource
  | EmoteResource
  | AvatarResource
  | FontResource
  | TilesetResource
  | SoundResource
  | MusicResource
  | PaletteResource
  | VariablesResource
  | EngineFieldValuesResource
  | SettingsResource
  | ProjectMetadataResource;

export type Resource =
  | BackgroundResource
  | CompressedBackgroundResource
  | SpriteResource
  | EmoteResource
  | AvatarResource
  | FontResource
  | TilesetResource
  | SoundResource
  | MusicResource
  | PaletteResource
  | ScriptResource;

export type CompressedProjectResources = {
  scenes: CompressedSceneResourceWithChildren[];
  actorPrefabs: ActorPrefabResource[];
  triggerPrefabs: TriggerPrefabResource[];
  scripts: ScriptResource[];
  sprites: SpriteResource[];
  backgrounds: CompressedBackgroundResource[];
  emotes: EmoteResource[];
  avatars: AvatarResource[];
  fonts: FontResource[];
  tilesets: TilesetResource[];
  sounds: SoundResource[];
  music: MusicResource[];
  palettes: PaletteResource[];
  variables: VariablesResource;
  engineFieldValues: EngineFieldValuesResource;
  settings: SettingsResource;
  metadata: ProjectMetadataResource;
};

export type ProjectResources = Omit<
  CompressedProjectResources,
  "scenes" | "backgrounds"
> & {
  scenes: SceneResource[];
  backgrounds: BackgroundResource[];
};

export type ProjectEntityResources = Omit<
  ProjectResources,
  "settings" | "metadata"
>;

export type WriteFile = { path: string; checksum: string; data: string };

export type WriteResourcesPatch = {
  data: WriteFile[];
  paths: string[];
  metadata: ProjectMetadataResource;
};

export const isProjectMetadataResource = (
  x: unknown,
): x is ProjectMetadataResource => {
  return (
    x !== null &&
    typeof x === "object" &&
    "_resourceType" in x &&
    (x as { _resourceType: string })._resourceType === "project"
  );
};
