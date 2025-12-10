import type { EntityState } from "@reduxjs/toolkit";
import type {
  Actor,
  Trigger,
  Scene,
  Constant,
  ScriptEditorCtxType,
  MetaspriteTile,
  Metasprite,
  SpriteState,
  SpriteAnimation,
  Sprite,
  SpriteAsset,
  Emote,
  EmoteAsset,
  Palette,
  Background,
  BackgroundAsset,
  TilesetAsset,
  Tileset,
  Font,
  FontAsset,
  Music,
  MusicAsset,
  Sound,
  SoundAsset,
} from "shared/lib/resources/types";

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
  | "actorPrefab"
  | "triggerPrefab";

export type ScriptEventArgs = Record<string, unknown>;

export type ScriptEvent = {
  id: string;
  command: string;
  args?: ScriptEventArgs | undefined;
  children?: Record<string, ScriptEvent[] | undefined> | undefined;
};

export type ScriptEventNormalized = Omit<ScriptEvent, "children"> & {
  children?: Record<string, string[]>;
};

export type ScriptEventArgsOverride = {
  id: string;
  args: ScriptEventArgs;
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
export type ActorScriptKey = (typeof actorScriptKeys)[number];

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

type ActorFieldsOmittedFromPrefab =
  | "prefabId"
  | "coordinateType"
  | "x"
  | "y"
  | "direction"
  | "isPinned"
  | "symbol"
  | "prefabScriptOverrides";

export type ActorPrefab = Omit<Actor, ActorFieldsOmittedFromPrefab>;

export type ActorPrefabNormalized = Omit<
  ActorNormalized,
  ActorFieldsOmittedFromPrefab
>;

export const triggerScriptKeys = ["script", "leaveScript"] as const;
export type TriggerScriptKey = (typeof triggerScriptKeys)[number];

export type TriggerNormalized = Omit<Trigger, "script" | "leaveScript"> & {
  script: string[];
  leaveScript: string[];
};

type TriggerFieldsOmittedFromPrefab =
  | "prefabId"
  | "x"
  | "y"
  | "width"
  | "height"
  | "symbol"
  | "prefabScriptOverrides";

export type TriggerPrefab = Omit<Trigger, TriggerFieldsOmittedFromPrefab>;

export type TriggerPrefabNormalized = Omit<
  TriggerNormalized,
  TriggerFieldsOmittedFromPrefab
>;

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

export type MusicSettings = {
  disableSpeedConversion?: boolean;
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
  variables: Record<string, CustomEventVariable>;
  actors: Record<string, CustomEventActor>;
  script: ScriptEvent[];
};

export type CustomEventNormalized = Omit<CustomEvent, "script"> & {
  script: string[];
};

export type EngineFieldValue = {
  id: string;
  value?: number | string | undefined;
};

export type MetaspriteNormalized = Omit<Metasprite, "tiles"> & {
  tiles: string[];
};

export type SpriteStateNormalized = Omit<SpriteState, "animations"> & {
  animations: string[];
};

export type SpriteAnimationNormalized = Omit<SpriteAnimation, "frames"> & {
  frames: string[];
};

export type SpriteSheetNormalized = Omit<SpriteAsset, "states"> & {
  states: string[];
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
export type SceneScriptKey = (typeof sceneScriptKeys)[number];

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
  backgrounds: Background[];
  spriteSheets: Sprite[];
  palettes: Palette[];
  customEvents: CustomEvent[];
  music: Music[];
  sounds: Sound[];
  fonts: Font[];
  avatars: AvatarData[];
  emotes: Emote[];
  tilesets: Tileset[];
  variables: Variable[];
  constants: Constant[];
  engineFieldValues: EngineFieldValue[];
};

export interface EntitiesState {
  actors: EntityState<ActorNormalized, string>;
  triggers: EntityState<TriggerNormalized, string>;
  scenes: EntityState<SceneNormalized, string>;
  actorPrefabs: EntityState<ActorPrefabNormalized, string>;
  triggerPrefabs: EntityState<TriggerPrefabNormalized, string>;
  scriptEvents: EntityState<ScriptEventNormalized, string>;
  backgrounds: EntityState<BackgroundAsset, string>;
  spriteSheets: EntityState<SpriteSheetNormalized, string>;
  metasprites: EntityState<MetaspriteNormalized, string>;
  metaspriteTiles: EntityState<MetaspriteTile, string>;
  spriteAnimations: EntityState<SpriteAnimationNormalized, string>;
  spriteStates: EntityState<SpriteStateNormalized, string>;
  palettes: EntityState<Palette, string>;
  customEvents: EntityState<CustomEventNormalized, string>;
  music: EntityState<MusicAsset, string>;
  sounds: EntityState<SoundAsset, string>;
  fonts: EntityState<FontAsset, string>;
  avatars: EntityState<Avatar, string>;
  emotes: EntityState<EmoteAsset, string>;
  tilesets: EntityState<TilesetAsset, string>;
  variables: EntityState<Variable, string>;
  constants: EntityState<Constant, string>;
  engineFieldValues: EntityState<EngineFieldValue, string>;
}

interface ScriptEventFieldCondition {
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
  parallaxEnabled?: boolean;
  sceneType?: string | string[];
  entityType?: string | string[];
  entityTypeNot?: string | string[];
}

const distanceUnitTypes = ["tiles", "pixels"] as const;
const timeUnitTypes = ["time", "frames"] as const;
const gridUnitTypes = ["8px", "16px"] as const;
export const unitTypes = [
  ...distanceUnitTypes,
  ...timeUnitTypes,
  ...gridUnitTypes,
] as const;

export type UnitType = (typeof unitTypes)[number];
export type DistanceUnitType = (typeof distanceUnitTypes)[number];
export type TimeUnitType = (typeof timeUnitTypes)[number];
export type GridUnitType = (typeof gridUnitTypes)[number];

export const movementTypes = ["horizontal", "vertical", "diagonal"] as const;
export type MovementType = (typeof movementTypes)[number];

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
  optionalLabel?: string;
  allowNone?: boolean;
  allowDefault?: boolean;
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
  allowedContexts?: ScriptEditorCtxType[];
  unitsField?: string;
  unitsDefault?: UnitType;
  unitsAllowed?: UnitType[];
  hideLabel?: boolean;
  description?: string;
  hasPostUpdateFn?: boolean;
  singleLine?: boolean;
  noneLabel?: string;
  variant?: string;
  labelVariant?: string;
  filters?: Record<string, unknown>;
}
