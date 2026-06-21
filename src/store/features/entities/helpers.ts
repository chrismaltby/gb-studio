import type { EntitiesState } from "shared/lib/entities/entitiesTypes";

// Local Selectors (only for use internally within EntitiesState reducers)

export const localSceneSelectById = (state: EntitiesState, id: string) =>
  state.scenes.entities[id];

export const localSceneSelectAll = (state: EntitiesState) =>
  state.scenes.ids.map((id) => state.scenes.entities[id]);

export const localSceneSelectTotal = (state: EntitiesState) =>
  state.scenes.ids.length;

export const localNoteSelectById = (state: EntitiesState, id: string) =>
  state.notes.entities[id];

export const localNoteSelectTotal = (state: EntitiesState) =>
  state.notes.ids.length;

export const localActorSelectById = (state: EntitiesState, id: string) =>
  state.actors.entities[id];

export const localActorSelectEntities = (state: EntitiesState) =>
  state.actors.entities;

export const localActorSelectAll = (state: EntitiesState) =>
  state.actors.ids.map((id) => state.actors.entities[id]);

export const localTriggerSelectById = (state: EntitiesState, id: string) =>
  state.triggers.entities[id];

export const localTriggerSelectEntities = (state: EntitiesState) =>
  state.triggers.entities;

export const localTriggerSelectAll = (state: EntitiesState) =>
  state.triggers.ids.map((id) => state.triggers.entities[id]);

export const localActorPrefabSelectById = (state: EntitiesState, id: string) =>
  state.actorPrefabs.entities[id];

export const localTriggerPrefabSelectById = (
  state: EntitiesState,
  id: string,
) => state.triggerPrefabs.entities[id];

export const localScriptEventSelectById = (state: EntitiesState, id: string) =>
  state.scriptEvents.entities[id];

export const localScriptEventSelectAll = (state: EntitiesState) =>
  state.scriptEvents.ids.map((id) => state.scriptEvents.entities[id]);

export const localCustomEventSelectTotal = (state: EntitiesState) =>
  state.customEvents.ids.length;

export const localSpriteSheetSelectById = (state: EntitiesState, id: string) =>
  state.spriteSheets.entities[id];

export const localSpriteSheetSelectAll = (state: EntitiesState) =>
  state.spriteSheets.ids.map((id) => state.spriteSheets.entities[id]);

export const localBackgroundSelectById = (state: EntitiesState, id: string) =>
  state.backgrounds.entities[id];

export const localBackgroundSelectAll = (state: EntitiesState) =>
  state.backgrounds.ids.map((id) => state.backgrounds.entities[id]);

export const localPaletteSelectTotal = (state: EntitiesState) =>
  state.palettes.ids.length;

export const localMusicSelectById = (state: EntitiesState, id: string) =>
  state.music.entities[id];

export const localMusicSelectAll = (state: EntitiesState) =>
  state.music.ids.map((id) => state.music.entities[id]);

export const localVariableSelectById = (state: EntitiesState, id: string) =>
  state.variables.entities[id];

export const localConstantSelectById = (state: EntitiesState, id: string) =>
  state.constants.entities[id];

export const localConstantSelectTotal = (state: EntitiesState) =>
  state.constants.ids.length;
