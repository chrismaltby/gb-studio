import { EntityState, Dictionary } from "@reduxjs/toolkit";

export type ActorDirection = "up" | "down" | "left" | "right";
export type ActorSpriteType = "static" | "actor";
export type SpriteType = "static" | "animated" | "actor" | "actor_animated";
export type SpriteSheetType = "classic" | "autodetect" | "manual";
export type SpriteAnimationType =
  | "fixed"
  | "fixed_movement"
  | "multi"
  | "multi_movement"
  | "platform_player";
export type ObjPalette = "OBP0" | "OBP1";

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
  collisionGroup: string;
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
  tileColors: number[];
  plugin?: string;
  inode: string;
  _v: number;
};

export type Font = {
  id: string;
  name: string;
  filename: string;
  width: number;
  height: number;
  plugin?: string;
  inode: string;
  _v: number;
};

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

export type SpriteAnimation = {
  id: string;
  frames: string[];
};

export type SpriteSheet = {
  id: string;
  name: string;
  filename: string;
  type: SpriteSheetType;
  numFrames: number;
  numTiles: number;
  plugin?: string;
  inode: string;
  checksum: string;
  _v: number;
  width: number;
  height: number;
  animationType: SpriteAnimationType;
  flipLeft: boolean;
  canvasWidth: number;
  canvasHeight: number;
  boundsX: number;
  boundsY: number;
  boundsWidth: number;
  boundsHeight: number;
  animations: string[];
  animSpeed: number | null;
  autoDetect: boolean;
};

export type SceneParallaxLayer = {
  height: number;
  speed: number;
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
  spritePaletteIds: string[];
  collisions: number[];
  actors: string[];
  triggers: string[];
  parallax?: SceneParallaxLayer[];
  playerSpriteSheetId?: string;
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
  fonts: Font[];
  avatars: Avatar[];
  emotes: Emote[];
  variables: Variable[];
};

export interface EntitiesState {
  actors: EntityState<Actor>;
  triggers: EntityState<Trigger>;
  scenes: EntityState<Scene>;
  backgrounds: EntityState<Background>;
  spriteSheets: EntityState<SpriteSheet>;
  metasprites: EntityState<Metasprite>;
  metaspriteTiles: EntityState<MetaspriteTile>;
  spriteAnimations: EntityState<SpriteAnimation>;
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

export type EntityKey = keyof EntitiesState;
