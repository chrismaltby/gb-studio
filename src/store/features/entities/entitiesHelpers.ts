import { normalize, denormalize, schema } from "normalizr";
import { ProjectEntitiesData, EntitiesState, EntityKey } from "./entitiesTypes";
import { EntityId, Dictionary } from "@reduxjs/toolkit";

const backgroundSchema = new schema.Entity("backgrounds");
const musicSchema = new schema.Entity("music");
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
const spriteSheetsSchema = new schema.Entity("spriteSheets");
const variablesSchema = new schema.Entity("variables");
const sceneSchema = new schema.Entity("scenes", {
  actors: [actorSchema],
  triggers: [triggerSchema],
  // script: [eventSchema],
});
const customEventsSchema = new schema.Entity("customEvents");
const palettesSchema = new schema.Entity("palettes");
const enginePropsSchema = new schema.Entity("engineProps");

const projectSchema = {
  scenes: [sceneSchema],
  backgrounds: [backgroundSchema],
  music: [musicSchema],
  spriteSheets: [spriteSheetsSchema],
  variables: [variablesSchema],
  customEvents: [customEventsSchema],
  palettes: [palettesSchema],
  engineProps: [enginePropsSchema]
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
    variables: state.variables.ids,
    engineProps: state.engineProps.ids,
  };
  const entities: Record<EntityKey, Dictionary<any>> = {
    actors: state.actors.entities,
    triggers: state.triggers.entities,
    scenes: state.scenes.entities,
    backgrounds: state.backgrounds.entities,
    spriteSheets: state.spriteSheets.entities,
    palettes: state.palettes.entities,
    customEvents: state.customEvents.entities,
    music: state.music.entities,
    variables: state.variables.entities,
    engineProps: state.engineProps.entities
  };
  return denormalize(input, projectSchema, entities);
};
