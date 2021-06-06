import { normalize, denormalize, schema, NormalizedSchema } from "normalizr";
import {
  ProjectEntitiesData,
  EntitiesState,
  Asset,
  SpriteSheet,
  Metasprite,
  MetaspriteTile,
  SpriteAnimation,
  Scene,
  Actor,
  Trigger,
  Background,
  Palette,
  Music,
  Font,
  Avatar,
  Emote,
  CustomEvent,
  Variable,
  EngineFieldValue,
  UnionValue,
  UnionDirectionValue,
  UnionNumberValue,
  UnionPropertyValue,
  UnionVariableValue,
  SpriteState,
} from "./entitiesTypes";
import { Dictionary, EntityId } from "@reduxjs/toolkit";
import { SpriteSheetData } from "lib/compiler/compileSprites";

export interface NormalisedEntities {
  scenes: Record<EntityId, Scene>;
  actors: Record<EntityId, Actor>;
  triggers: Record<EntityId, Trigger>;
  backgrounds: Record<EntityId, Background>;
  spriteSheets: Record<EntityId, SpriteSheet>;
  metasprites: Record<EntityId, Metasprite>;
  metaspriteTiles: Record<EntityId, MetaspriteTile>;
  spriteAnimations: Record<EntityId, SpriteAnimation>;
  spriteStates: Record<EntityId, SpriteState>;
  palettes: Record<EntityId, Palette>;
  music: Record<EntityId, Music>;
  fonts: Record<EntityId, Font>;
  avatars: Record<EntityId, Avatar>;
  emotes: Record<EntityId, Emote>;
  customEvents: Record<EntityId, CustomEvent>;
  variables: Record<EntityId, Variable>;
  engineFieldValues: Record<EntityId, EngineFieldValue>;
}

export interface NormalisedResult {
  scenes: EntityId[];
  backgrounds: EntityId[];
  spriteSheets: EntityId[];
  palettes: EntityId[];
  customEvents: EntityId[];
  music: EntityId[];
  fonts: EntityId[];
  avatars: EntityId[];
  emotes: EntityId[];
  variables: EntityId[];
  engineFieldValues: EntityId[];
}

export type NormalisedData = NormalizedSchema<
  NormalisedEntities,
  NormalisedResult
>;

const backgroundSchema = new schema.Entity("backgrounds");
const musicSchema = new schema.Entity("music");
const fontSchema = new schema.Entity("fonts");
const avatarSchema = new schema.Entity("avatars");
const emoteSchema = new schema.Entity("emotes");
const actorSchema = new schema.Entity("actors");
const triggerSchema = new schema.Entity("triggers");
/*
// Normalise events
const eventSchema = new schema.Entity("events");
eventSchema.define({
  children: {
    true: [eventSchema],
    false: [eventSchema],
    script: [eventSchema]
  }
});
*/
const metaspriteTilesSchema = new schema.Entity("metaspriteTiles");
const metaspritesSchema = new schema.Entity("metasprites", {
  tiles: [metaspriteTilesSchema],
});
const spriteAnimationsSchema = new schema.Entity("spriteAnimations", {
  frames: [metaspritesSchema],
});
const spriteStatesSchema = new schema.Entity("spriteStates", {
  animations: [spriteAnimationsSchema],
});
const spriteSheetsSchema = new schema.Entity("spriteSheets", {
  states: [spriteStatesSchema],
});

const variablesSchema = new schema.Entity("variables");
const sceneSchema = new schema.Entity("scenes", {
  actors: [actorSchema],
  triggers: [triggerSchema],
  // script: [eventSchema],
});
const customEventsSchema = new schema.Entity("customEvents");
const palettesSchema = new schema.Entity("palettes");
const engineFieldValuesSchema = new schema.Entity("engineFieldValues");

const projectSchema = {
  scenes: [sceneSchema],
  backgrounds: [backgroundSchema],
  music: [musicSchema],
  fonts: [fontSchema],
  avatars: [avatarSchema],
  emotes: [emoteSchema],
  spriteSheets: [spriteSheetsSchema],
  variables: [variablesSchema],
  customEvents: [customEventsSchema],
  palettes: [palettesSchema],
  engineFieldValues: [engineFieldValuesSchema],
};

export const normalizeEntities = (
  projectData: ProjectEntitiesData
): NormalisedData => {
  console.log(
    normalize<NormalisedEntities, NormalisedResult>(projectData, projectSchema)
  );

  return normalize<NormalisedEntities, NormalisedResult>(
    projectData,
    projectSchema
  );
};

export const denormalizeEntities = (
  state: EntitiesState
): ProjectEntitiesData => {
  const input: NormalisedResult = {
    scenes: state.scenes.ids,
    backgrounds: state.backgrounds.ids,
    spriteSheets: state.spriteSheets.ids,
    palettes: state.palettes.ids,
    customEvents: state.customEvents.ids,
    music: state.music.ids,
    fonts: state.fonts.ids,
    avatars: state.avatars.ids,
    emotes: state.emotes.ids,
    variables: state.variables.ids,
    engineFieldValues: state.engineFieldValues.ids,
  };
  const entities: NormalisedEntities = {
    actors: state.actors.entities as Record<EntityId, Actor>,
    triggers: state.triggers.entities as Record<EntityId, Trigger>,
    scenes: state.scenes.entities as Record<EntityId, Scene>,
    backgrounds: state.backgrounds.entities as Record<EntityId, Background>,
    spriteSheets: state.spriteSheets.entities as Record<EntityId, SpriteSheet>,
    metasprites: state.metasprites.entities as Record<EntityId, Metasprite>,
    metaspriteTiles: state.metaspriteTiles.entities as Record<
      EntityId,
      MetaspriteTile
    >,
    spriteAnimations: state.spriteAnimations.entities as Record<
      EntityId,
      SpriteAnimation
    >,
    spriteStates: state.spriteStates.entities as Record<EntityId, SpriteState>,
    palettes: state.palettes.entities as Record<EntityId, Palette>,
    customEvents: state.customEvents.entities as Record<EntityId, CustomEvent>,
    music: state.music.entities as Record<EntityId, Music>,
    fonts: state.fonts.entities as Record<EntityId, Font>,
    avatars: state.avatars.entities as Record<EntityId, Avatar>,
    emotes: state.emotes.entities as Record<EntityId, Emote>,
    variables: state.variables.entities as Record<EntityId, Variable>,
    engineFieldValues: state.engineFieldValues.entities as Record<
      EntityId,
      EngineFieldValue
    >,
  };
  return denormalize(input, projectSchema, entities);
};

export const denormalizeSprite = ({
  sprite,
  metasprites,
  metaspriteTiles,
  spriteAnimations,
  spriteStates,
}: {
  sprite: SpriteSheet;
  metasprites: Dictionary<Metasprite>;
  metaspriteTiles: Dictionary<MetaspriteTile>;
  spriteAnimations: Dictionary<SpriteAnimation>;
  spriteStates: Dictionary<SpriteState>;
}): SpriteSheetData => {
  const entities = {
    metasprites,
    metaspriteTiles,
    spriteAnimations,
    spriteStates,
  };
  return denormalize(sprite, spriteSheetsSchema, entities);
};

export const matchAsset = (assetA: Asset) => (assetB: Asset) => {
  return assetA.filename === assetB.filename && assetA.plugin === assetB.plugin;
};

export const sortByFilename = (a: Asset, b: Asset) => {
  if (a.filename > b.filename) return 1;
  if (a.filename < b.filename) return -1;
  return 0;
};

export const swap = <T extends unknown>(
  x: number,
  y: number,
  [...xs]: T[]
): T[] => (xs.length > 1 ? (([xs[x], xs[y]] = [xs[y], xs[x]]), xs) : xs);

export const isUnionValue = (input: unknown): input is UnionValue => {
  if (typeof input !== "object") {
    return false;
  }
  if (!input || !("type" in input)) {
    return false;
  }
  return true;
};

export const isUnionVariableValue = (
  input: unknown
): input is UnionVariableValue => {
  if (!isUnionValue(input)) {
    return false;
  }
  if (input.type !== "variable") {
    return false;
  }
  return true;
};

export const isUnionPropertyValue = (
  input: unknown
): input is UnionPropertyValue => {
  if (!isUnionValue(input)) {
    return false;
  }
  if (input.type !== "property") {
    return false;
  }
  return true;
};

export const isUnionNumberValue = (
  input: unknown
): input is UnionNumberValue => {
  if (!isUnionValue(input)) {
    return false;
  }
  if (input.type !== "number") {
    return false;
  }
  return true;
};

export const isUnionDirectionValue = (
  input: unknown
): input is UnionDirectionValue => {
  if (!isUnionValue(input)) {
    return false;
  }
  if (input.type !== "direction") {
    return false;
  }
  return true;
};
