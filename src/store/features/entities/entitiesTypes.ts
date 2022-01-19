import { EntityState, Dictionary } from "@reduxjs/toolkit";

export type ActorDirection = "up" | "down" | "left" | "right";
export type SpriteType = "static" | "animated" | "actor" | "actor_animated";
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
  | "customEvent";

export type ScriptEvent = {
  id: string;
  command: string;
  args?: Record<string, unknown>;
  children?: Dictionary<string[]>;
};

export type ScriptEventDenormalized = Omit<ScriptEvent, "children"> & {
  children?: Dictionary<ScriptEventDenormalized[]>;
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
  notes?: string;
  x: number;
  y: number;
  spriteSheetId: string;
  paletteId: string;
  frame: number;
  moveSpeed: number;
  animSpeed: number | null;
  direction: ActorDirection;
  animate: boolean;
  isPinned: boolean;
  collisionGroup: string;
  script: string[];
  startScript: string[];
  updateScript: string[];
  hit1Script: string[];
  hit2Script: string[];
  hit3Script: string[];
};

export type ActorDenormalized = Omit<
  Actor,
  | "script"
  | "startScript"
  | "updateScript"
  | "hit1Script"
  | "hit2Script"
  | "hit3Script"
> & {
  script: ScriptEventDenormalized[];
  startScript: ScriptEventDenormalized[];
  updateScript: ScriptEventDenormalized[];
  hit1Script: ScriptEventDenormalized[];
  hit2Script: ScriptEventDenormalized[];
  hit3Script: ScriptEventDenormalized[];
};

export const triggerScriptKeys = ["script", "leaveScript"] as const;
export type TriggerScriptKey = typeof triggerScriptKeys[number];

export type Trigger = {
  id: string;
  name: string;
  notes?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  script: string[];
  leaveScript: string[];
};

export type TriggerDenormalized = Omit<Trigger, "script" | "leaveScript"> & {
  script: ScriptEventDenormalized[];
  leaveScript: ScriptEventDenormalized[];
};

export type Background = {
  id: string;
  name: string;
  filename: string;
  width: number;
  height: number;
  imageWidth: number;
  imageHeight: number;
  tileColors: number[];
  plugin?: string;
  inode: string;
  _v: number;
};

export type BackgroundData = Omit<Background, "_v" | "inode">;

export type Font = {
  id: string;
  name: string;
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
  filename: string;
  plugin?: string;
  settings: MusicSettings;
  type?: string;
  inode: string;
  _v: number;
};

export type MusicData = Omit<Music, "_v" | "inode">;

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
};

export type CustomEventVariable = {
  id: string;
  name: string;
  type?: "8bit" | "16bit";
};

export type CustomEventActor = {
  id: string;
  name: string;
};

export type CustomEvent = {
  id: string;
  name: string;
  description: string;
  variables: Dictionary<CustomEventVariable>;
  actors: Dictionary<CustomEventActor>;
  script: string[];
};

export type CustomEventDenormalized = Omit<CustomEvent, "script"> & {
  script: ScriptEventDenormalized[];
};

export type EngineFieldValue = {
  id: string;
  value: number | string | boolean | undefined;
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
  states: string[];
};

export type SpriteSheetData = Omit<SpriteSheet, "states" | "_v" | "inode"> & {
  states: SpriteStateData[];
};

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
  notes?: string;
  labelColor?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundId: string;
  paletteIds: string[];
  spritePaletteIds: string[];
  collisions: number[];
  autoFadeSpeed: number | null;
  autoFadeEventCollapse?: boolean;
  actors: string[];
  triggers: string[];
  parallax?: SceneParallaxLayer[];
  playerSpriteSheetId?: string;
  script: string[];
  playerHit1Script: string[];
  playerHit2Script: string[];
  playerHit3Script: string[];
};

export type SceneData = Omit<Scene, "actors" | "triggers"> & {
  actors: Actor[];
  triggers: Trigger[];
};

export type SceneDenormalized = Omit<
  Scene,
  | "actors"
  | "triggers"
  | "script"
  | "playerHit1Script"
  | "playerHit2Script"
  | "playerHit3Script"
> & {
  actors: ActorDenormalized[];
  triggers: TriggerDenormalized[];
  script: ScriptEventDenormalized[];
  playerHit1Script: ScriptEventDenormalized[];
  playerHit2Script: ScriptEventDenormalized[];
  playerHit3Script: ScriptEventDenormalized[];
};

export type ProjectEntitiesData = {
  scenes: SceneDenormalized[];
  backgrounds: BackgroundData[];
  spriteSheets: SpriteSheetData[];
  palettes: Palette[];
  customEvents: CustomEvent[];
  music: MusicData[];
  fonts: FontData[];
  avatars: AvatarData[];
  emotes: EmoteData[];
  variables: Variable[];
};

export interface EntitiesState {
  actors: EntityState<Actor>;
  triggers: EntityState<Trigger>;
  scenes: EntityState<Scene>;
  scriptEvents: EntityState<ScriptEvent>;
  backgrounds: EntityState<Background>;
  spriteSheets: EntityState<SpriteSheet>;
  metasprites: EntityState<Metasprite>;
  metaspriteTiles: EntityState<MetaspriteTile>;
  spriteAnimations: EntityState<SpriteAnimation>;
  spriteStates: EntityState<SpriteState>;
  palettes: EntityState<Palette>;
  customEvents: EntityState<CustomEvent>;
  music: EntityState<Music>;
  fonts: EntityState<Font>;
  avatars: EntityState<Avatar>;
  emotes: EntityState<Emote>;
  variables: EntityState<Variable>;
  engineFieldValues: EntityState<EngineFieldValue>;
}

export type Asset = {
  filename: string;
  plugin?: string;
};

export interface ScriptEventFieldCondition {
  key: string;
  ne?: unknown;
  eq?: unknown;
  gt?: unknown;
  lt?: unknown;
  gte?: unknown;
  lte?: unknown;
  in?: unknown[];
}

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
  flexBasis?: string;
  values?: Record<string, string>;
  alignCheckbox?: boolean;
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
  includePlayer?: boolean;
  defaultType?: string;
  types?: string[];
  fields?: ScriptEventFieldSchema[];
  inline?: boolean;
  filter?: (value: unknown) => boolean;
  updateFn?: (
    newValue: unknown,
    field: ScriptEventFieldSchema,
    args: Record<string, unknown>
  ) => unknown;
  postUpdate?: (
    newArgs: Record<string, unknown>,
    prevArgs: Record<string, unknown>
  ) => void;
}

export type EntityKey = keyof EntitiesState;
