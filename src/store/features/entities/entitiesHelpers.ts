import { normalize, denormalize, schema } from "normalizr";
import {
  ProjectEntitiesData,
  EntitiesState,
  EntityKey,
  Asset,
} from "./entitiesTypes";
import { EntityId, Dictionary } from "@reduxjs/toolkit";

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
const spriteSheetsSchema = new schema.Entity("spriteSheets", {
  animations: [spriteAnimationsSchema],
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

type ProjectSchemaKey = keyof typeof projectSchema;

export const normalizeEntities = (projectData: ProjectEntitiesData) => {
  return normalize(projectData, projectSchema);
};

export const denormalizeEntities = (
  state: EntitiesState
): ProjectEntitiesData => {
  const input: Record<ProjectSchemaKey, EntityId[]> = {
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
  const entities: Record<EntityKey, Dictionary<any>> = {
    actors: state.actors.entities,
    triggers: state.triggers.entities,
    scenes: state.scenes.entities,
    backgrounds: state.backgrounds.entities,
    spriteSheets: state.spriteSheets.entities,
    metasprites: state.metasprites.entities,
    metaspriteTiles: state.metaspriteTiles.entities,
    spriteAnimations: state.spriteAnimations.entities,
    palettes: state.palettes.entities,
    customEvents: state.customEvents.entities,
    music: state.music.entities,
    fonts: state.fonts.entities,
    avatars: state.avatars.entities,
    emotes: state.emotes.entities,
    variables: state.variables.entities,
    engineFieldValues: state.engineFieldValues.entities,
  };
  return denormalize(input, projectSchema, entities);
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
