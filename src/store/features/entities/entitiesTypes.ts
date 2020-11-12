import { EntityState, Dictionary } from "@reduxjs/toolkit";

export type ActorDirection = "up" | "down" | "left" | "right";
export type ActorSpriteType = "static" | "actor";
export type SpriteType = "static" | "animated" | "actor" | "actor_animated";

export type ScriptEvent = {
  id: string;
  command: string;
  args: any;
  children?: Dictionary<ScriptEvent[]>;
};

export type Actor = {
  id: string;
  name: string;
  notes?: string;
  x: number;
  y: number;
  spriteSheetId: string;
  spriteType: ActorSpriteType;
  paletteId: string;
  frame: number;
  moveSpeed: number;
  animSpeed: number | null;
  direction: ActorDirection;
  animate: boolean;
  isPinned: boolean;
  collisionGroup: string[];
  script: ScriptEvent[];
  startScript: ScriptEvent[];
  updateScript: ScriptEvent[];
  hit1Script: ScriptEvent[];
  hit2Script: ScriptEvent[];
  hit3Script: ScriptEvent[];
};

export type Trigger = {
  id: string;
  name: string;
  notes?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  script: ScriptEvent[];
};

export type Background = {
  id: string;
  name: string;
  filename: string;
  width: number;
  height: number;
  imageWidth: number;
  imageHeight: number;
  plugin?: string;
  inode: string;
  _v: number;
};

export type MusicSettings = {
  disableSpeedConversion?: boolean;
};

export type Music = {
  id: string;
  name: string;
  filename: string;
  plugin?: string;
  settings: MusicSettings;
  inode: string;
  _v: number;
};

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
  script: ScriptEvent[];
};

export type EngineFieldValue = {
  id: string;
  value: number | string | boolean | undefined;
};

export type SpriteSheet = {
  id: string;
  name: string;
  filename: string;
  type: SpriteType;
  numFrames: number;
  plugin?: string;
  inode: string;
  _v: number;
};

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
  collisions: number[];
  tileColors: number[];
  actors: string[];
  triggers: string[];
  script: ScriptEvent[];
  playerHit1Script: ScriptEvent[];
  playerHit2Script: ScriptEvent[];
  playerHit3Script: ScriptEvent[];
};

export type SceneData = Omit<Scene, "actors" | "triggers"> & {
  actors: Actor[];
  triggers: Trigger[];
};

export type ProjectEntitiesData = {
  scenes: SceneData[];
  backgrounds: Background[];
  spriteSheets: SpriteSheet[];
  palettes: Palette[];
  customEvents: CustomEvent[];
  music: Music[];
  variables: Variable[];
};

export interface EntitiesState {
  actors: EntityState<Actor>;
  triggers: EntityState<Trigger>;
  scenes: EntityState<Scene>;
  backgrounds: EntityState<Background>;
  spriteSheets: EntityState<SpriteSheet>;
  palettes: EntityState<Palette>;
  customEvents: EntityState<CustomEvent>;
  music: EntityState<Music>;
  variables: EntityState<Variable>;
  engineFieldValues: EntityState<EngineFieldValue>;
}

export type Asset = {
  filename: string;
  plugin?: string;
};

export type EntityKey = keyof EntitiesState;
