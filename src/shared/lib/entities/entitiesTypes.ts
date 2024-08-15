import type { EntityState, Dictionary } from "@reduxjs/toolkit";
import type { ScriptEditorContextType } from "shared/lib/scripts/context";

export type CollisionGroup = "" | "1" | "2" | "3" | "player";

export type ActorDirection = "up" | "down" | "left" | "right";
export type SpriteAnimationType =
  | "fixed"
  | "fixed_movement"
  | "multi"
  | "multi_movement"
  | "platform_player"
  | "cursor";
export type ObjPalette = "OBP0" | "OBP1";

export type UnionVariableValue = {
  type: "variable";
  value?: string;
};

export type UnionPropertyValue = {
  type: "property";
  value?: string;
};

export type UnionNumberValue = {
  type: "number";
  value?: number;
};

export type UnionDirectionValue = {
  type: "direction";
  value?: string;
};

export type UnionValue =
  | UnionVariableValue
  | UnionPropertyValue
  | UnionNumberValue
  | UnionDirectionValue;

export type ScriptEventParentType =
  | "scene"
  | "actor"
  | "trigger"
  | "scriptEvent"
  | "customEvent"
  | "actorPrefab";

export type ScriptEventArgs = Record<string, unknown>;

export type ScriptEvent = {
  id: string;
  command: string;
  symbol?: string | undefined;
  args?: ScriptEventArgs | undefined;
  children?: Record<string, ScriptEvent[] | undefined> | undefined;
};

export type ScriptEventNormalized = Omit<ScriptEvent, "children"> & {
  children?: Dictionary<string[]>;
};

export type ScriptEventsRef = {
  scriptEventId: string;
  parentType: ScriptEventParentType;
  parentKey: string;
  parentId: string;
};

export const actorScriptKeys = [
  "script",
  "startScript",
  "updateScript",
  "hit1Script",
  "hit2Script",
  "hit3Script",
] as const;
export type ActorScriptKey = typeof actorScriptKeys[number];

export type Actor = {
  id: string;
  name: string;
  symbol: string;
  notes?: string;
  x: number;
  y: number;
  prefabId: string;
  spriteSheetId: string;
  paletteId: string;
  frame: number;
  moveSpeed: number;
  animSpeed: number;
  direction: ActorDirection;
  animate: boolean;
  isPinned: boolean;
  persistent: boolean;
  collisionGroup: CollisionGroup;
  script: ScriptEvent[];
  startScript: ScriptEvent[];
  updateScript: ScriptEvent[];
  hit1Script: ScriptEvent[];
  hit2Script: ScriptEvent[];
  hit3Script: ScriptEvent[];
};

export type ActorNormalized = Omit<
  Actor,
  | "script"
  | "startScript"
  | "updateScript"
  | "hit1Script"
  | "hit2Script"
  | "hit3Script"
> & {
  script: string[];
  startScript: string[];
  updateScript: string[];
  hit1Script: string[];
  hit2Script: string[];
  hit3Script: string[];
};

export type ActorPrefab = Omit<Actor, "prefabId" | "x" | "y">;

export type ActorPrefabNormalized = Omit<
  ActorNormalized,
  "prefabId" | "x" | "y"
>;

export const triggerScriptKeys = ["script", "leaveScript"] as const;
export type TriggerScriptKey = typeof triggerScriptKeys[number];

export type Trigger = {
  id: string;
  name: string;
  symbol: string;
  notes?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  script: ScriptEvent[];
  leaveScript: ScriptEvent[];
};

export type TriggerNormalized = Omit<Trigger, "script" | "leaveScript"> & {
  script: string[];
  leaveScript: string[];
};

export type Background = {
  id: string;
  name: string;
  symbol: string;
  filename: string;
  width: number;
  height: number;
  imageWidth: number;
  imageHeight: number;
  tileColors: number[];
  monoOverrideId?: string;
  autoColor?: boolean;
  plugin?: string;
  inode: string;
  _v: number;
};

export type BackgroundData = Omit<Background, "_v" | "inode">;

export type Font = {
  id: string;
  name: string;
  symbol: string;
  filename: string;
  width: number;
  height: number;
  plugin?: string;
  inode: string;
  mapping: Record<string, number>;
  _v: number;
};

export type FontData = Omit<Font, "mapping" | "_v" | "inode">;

export type Avatar = {
  id: string;
  name: string;
  filename: string;
  width: number;
  height: number;
  plugin?: string;
  inode: string;
  _v: number;
};

export type AvatarData = Omit<Avatar, "_v" | "inode">;

export type Emote = {
  id: string;
  name: string;
  symbol: string;
  filename: string;
  width: number;
  height: number;
  plugin?: string;
  inode: string;
  _v: number;
};

export type EmoteData = Omit<Emote, "_v" | "inode">;

export type MusicSettings = {
  disableSpeedConversion?: boolean;
};

export type Music = {
  id: string;
  name: string;
  symbol: string;
  filename: string;
  plugin?: string;
  settings: MusicSettings;
  type?: string;
  inode: string;
  _v: number;
};

export type MusicData = Omit<Music, "_v" | "inode">;

export type Sound = {
  id: string;
  name: string;
  symbol: string;
  filename: string;
  plugin?: string;
  type: "wav" | "vgm" | "fxhammer";
  inode: string;
  _v: number;
};

export type SoundData = Omit<Sound, "_v" | "inode">;

export type Tileset = {
  id: string;
  name: string;
  symbol: string;
  filename: string;
  width: number;
  height: number;
  imageWidth: number;
  imageHeight: number;
  plugin?: string;
  inode: string;
  _v: number;
};

export type TilesetData = Omit<Tileset, "_v" | "inode">;

export type Palette = {
  id: string;
  name: string;
  colors: [string, string, string, string];
  defaultName?: string;
  defaultColors?: [string, string, string, string];
};

export type Variable = {
  id: string;
  name: string;
  symbol: string;
  flags?: Record<string, string>;
};

export type CustomEventVariable = {
  id: string;
  name: string;
  passByReference: boolean;
};

export type CustomEventActor = {
  id: string;
  name: string;
};

export type CustomEvent = {
  id: string;
  name: string;
  symbol: string;
  description: string;
  variables: Dictionary<CustomEventVariable>;
  actors: Dictionary<CustomEventActor>;
  script: ScriptEvent[];
};

export type CustomEventNormalized = Omit<CustomEvent, "script"> & {
  script: string[];
};

export type EngineFieldValue = {
  id: string;
  value?: number | string | boolean | undefined;
};

export type MetaspriteTile = {
  id: string;
  x: number;
  y: number;
  sliceX: number;
  sliceY: number;
  palette: number;
  flipX: boolean;
  flipY: boolean;
  objPalette: ObjPalette;
  paletteIndex: number;
  priority: boolean;
};

export type Metasprite = {
  id: string;
  tiles: string[];
};

export type MetaspriteData = Omit<Metasprite, "tiles"> & {
  tiles: MetaspriteTile[];
};

export type SpriteState = {
  id: string;
  name: string;
  animationType: SpriteAnimationType;
  flipLeft: boolean;
  animations: string[];
};

export type SpriteStateData = Omit<SpriteState, "animations"> & {
  animations: SpriteAnimationData[];
};

export type SpriteAnimation = {
  id: string;
  frames: string[];
};

export type SpriteAnimationData = Omit<SpriteAnimation, "frames"> & {
  frames: MetaspriteData[];
};

export type SpriteSheet = {
  id: string;
  name: string;
  symbol: string;
  filename: string;
  numTiles: number;
  plugin?: string;
  inode: string;
  checksum: string;
  _v: number;
  width: number;
  height: number;
  canvasWidth: number;
  canvasHeight: number;
  boundsX: number;
  boundsY: number;
  boundsWidth: number;
  boundsHeight: number;
  animSpeed: number | null;
  states: SpriteStateData[];
};

export type SpriteSheetNormalized = Omit<SpriteSheet, "states"> & {
  states: string[];
};

export type SpriteSheetData = Omit<SpriteSheet, "_v" | "inode">;

export type SceneParallaxLayer = {
  height: number;
  speed: number;
};

export const sceneScriptKeys = [
  "script",
  "playerHit1Script",
  "playerHit2Script",
  "playerHit3Script",
] as const;
export type SceneScriptKey = typeof sceneScriptKeys[number];

export type Scene = {
  id: string;
  type: string;
  name: string;
  symbol: string;
  notes?: string;
  labelColor?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundId: string;
  tilesetId: string;
  paletteIds: string[];
  spritePaletteIds: string[];
  collisions: number[];
  autoFadeSpeed: number | null;
  autoFadeEventCollapse?: boolean;
  parallax?: SceneParallaxLayer[];
  playerSpriteSheetId?: string;
  actors: Actor[];
  triggers: Trigger[];
  script: ScriptEvent[];
  playerHit1Script: ScriptEvent[];
  playerHit2Script: ScriptEvent[];
  playerHit3Script: ScriptEvent[];
};

export type SceneNormalized = Omit<
  Scene,
  | "actors"
  | "triggers"
  | "script"
  | "playerHit1Script"
  | "playerHit2Script"
  | "playerHit3Script"
> & {
  actors: string[];
  triggers: string[];
  script: string[];
  playerHit1Script: string[];
  playerHit2Script: string[];
  playerHit3Script: string[];
};

export type ProjectEntitiesData = {
  scenes: Scene[];
  backgrounds: BackgroundData[];
  spriteSheets: SpriteSheetData[];
  palettes: Palette[];
  customEvents: CustomEvent[];
  music: MusicData[];
  sounds: SoundData[];
  fonts: FontData[];
  avatars: AvatarData[];
  emotes: EmoteData[];
  tilesets: TilesetData[];
  variables: Variable[];
  engineFieldValues: EngineFieldValue[];
};

export interface EntitiesState {
  actors: EntityState<ActorNormalized>;
  triggers: EntityState<TriggerNormalized>;
  scenes: EntityState<SceneNormalized>;
  actorPrefabs: EntityState<ActorPrefabNormalized>;
  scriptEvents: EntityState<ScriptEventNormalized>;
  backgrounds: EntityState<Background>;
  spriteSheets: EntityState<SpriteSheetNormalized>;
  metasprites: EntityState<Metasprite>;
  metaspriteTiles: EntityState<MetaspriteTile>;
  spriteAnimations: EntityState<SpriteAnimation>;
  spriteStates: EntityState<SpriteState>;
  palettes: EntityState<Palette>;
  customEvents: EntityState<CustomEventNormalized>;
  music: EntityState<Music>;
  sounds: EntityState<Sound>;
  fonts: EntityState<Font>;
  avatars: EntityState<Avatar>;
  emotes: EntityState<Emote>;
  tilesets: EntityState<Tileset>;
  variables: EntityState<Variable>;
  engineFieldValues: EntityState<EngineFieldValue>;
}

export interface ScriptEventFieldCondition {
  key: string;
  ne?: unknown;
  eq?: unknown;
  gt?: unknown;
  lt?: unknown;
  gte?: unknown;
  lte?: unknown;
  in?: unknown[];
  set?: boolean;
  soundType?: unknown;
}

export const distanceUnitTypes = ["tiles", "pixels"] as const;
export const timeUnitTypes = ["time", "frames"] as const;
export const gridUnitTypes = ["8px", "16px"] as const;
export const unitTypes = [
  ...distanceUnitTypes,
  ...timeUnitTypes,
  ...gridUnitTypes,
] as const;

export type UnitType = typeof unitTypes[number];
export type DistanceUnitType = typeof distanceUnitTypes[number];
export type TimeUnitType = typeof timeUnitTypes[number];
export type GridUnitType = typeof gridUnitTypes[number];

export const movementTypes = ["horizontal", "vertical", "diagonal"] as const;
export type MovementType = typeof movementTypes[number];

export interface ScriptEventFieldSchema {
  label?: string | React.ReactNode;
  checkboxLabel?: string;
  defaultValue?: unknown | Record<string, unknown>;
  key?: string;
  type?: string;
  hide?: boolean;
  multiple?: boolean;
  conditions?: ScriptEventFieldCondition[];
  toggleLabel?: string;
  width?: string;
  flexBasis?: string | number;
  flexGrow?: number;
  alignBottom?: boolean;
  wrapItems?: boolean;
  minWidth?: string | number;
  values?: Record<string, string>;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  options?: [unknown, string][];
  optional?: boolean;
  allowNone?: boolean;
  allowMultiple?: boolean;
  paletteType?: "background" | "ui" | "emote" | "sprite";
  paletteIndex?: number;
  canKeep?: boolean;
  canRestore?: boolean;
  includePlayer?: boolean;
  defaultType?: string;
  types?: string[];
  fields?: ScriptEventFieldSchema[];
  inline?: boolean;
  allowedContexts?: ScriptEditorContextType[];
  unitsField?: string;
  unitsDefault?: UnitType;
  unitsAllowed?: UnitType[];
  hideLabel?: boolean;
  description?: string;
  hasPostUpdateFn?: boolean;
  singleLine?: boolean;
  noneLabel?: string;
}

export type EntityKey = keyof EntitiesState;
