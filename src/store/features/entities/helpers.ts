import { v4 as uuid } from "uuid";
import type {
  EntitiesState,
  ScriptEventParentType,
} from "shared/lib/entities/entitiesTypes";
import { ScriptEventArgsOverride } from "shared/lib/resources/types";
import { scriptEventsAdapter } from "store/features/entities/adapters";
import { assertUnreachable } from "shared/lib/helpers/assert";

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

export const localTilesetSelectById = (state: EntitiesState, id: string) =>
  state.tilesets.entities[id];

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

export const duplicateScript = (
  state: EntitiesState,
  scriptEventIds: string[],
  overrides?: Record<string, ScriptEventArgsOverride>,
): string[] => {
  const newIds = scriptEventIds.map(() => uuid());
  scriptEventIds.forEach((scriptEventId, index) => {
    const scriptEvent = localScriptEventSelectById(state, scriptEventId);
    if (scriptEvent) {
      const duplicatedChildren: Record<string, string[]> = {};
      if (scriptEvent.children) {
        for (const [key, childIds] of Object.entries(scriptEvent.children)) {
          duplicatedChildren[key] = duplicateScript(
            state,
            childIds || [],
            overrides,
          );
        }
      }
      const override = overrides?.[scriptEvent.id];
      scriptEventsAdapter.addOne(state.scriptEvents, {
        ...scriptEvent,
        args: override
          ? {
              ...scriptEvent.args,
              ...override.args,
            }
          : scriptEvent.args,
        id: newIds[index],
        children: duplicatedChildren,
      });
    }
  });
  return newIds;
};

// @todo CM: likely should rename to something like getOrCreateScriptIds as it can mutate input
export const selectScriptIds = (
  state: EntitiesState,
  parentType: ScriptEventParentType,
  parentId: string,
  parentKey: string,
): string[] | undefined => {
  if (parentType === "scene") {
    const scene = state.scenes.entities[parentId];
    if (!scene) return;
    const script = scene[parentKey as "script"];
    if (script) {
      return script;
    }
    const newScript = (scene[parentKey as "script"] = []);
    return newScript;
  } else if (parentType === "scriptEvent") {
    const scriptEvent = state.scriptEvents.entities[parentId];
    if (!scriptEvent) return;
    const script = scriptEvent.children?.[parentKey];
    if (script) {
      return script;
    }
    if (!scriptEvent.children) {
      scriptEvent.children = {
        [parentKey]: [],
      };
      return scriptEvent.children?.[parentKey];
    } else {
      scriptEvent.children[parentKey] = [];
      return scriptEvent.children[parentKey];
    }
  } else if (parentType === "actor") {
    const actor = state.actors.entities[parentId];
    if (!actor) return;
    const script = actor[parentKey as "script"];
    if (script) {
      return script;
    }
    const newScript = (actor[parentKey as "script"] = []);
    return newScript;
  } else if (parentType === "trigger") {
    const trigger = state.triggers.entities[parentId];
    if (!trigger) return;
    const script = trigger[parentKey as "script"];
    if (script) {
      return script;
    }
    const newScript = (trigger[parentKey as "script"] = []);
    return newScript;
  } else if (parentType === "customEvent") {
    const customEvent = state.customEvents.entities[parentId];
    if (!customEvent) return;
    const script = customEvent[parentKey as "script"];
    if (script) {
      return script;
    }
    const newScript = (customEvent[parentKey as "script"] = []);
    return newScript;
  } else if (parentType === "actorPrefab") {
    const actorPrefab = state.actorPrefabs.entities[parentId];
    if (!actorPrefab) return;
    const script = actorPrefab[parentKey as "script"];
    if (script) {
      return script;
    }
    const newScript = (actorPrefab[parentKey as "script"] = []);
    return newScript;
  } else if (parentType === "triggerPrefab") {
    const triggerPrefab = state.triggerPrefabs.entities[parentId];
    if (!triggerPrefab) return;
    const script = triggerPrefab[parentKey as "script"];
    if (script) {
      return script;
    }
    const newScript = (triggerPrefab[parentKey as "script"] = []);
    return newScript;
  } else {
    assertUnreachable(parentType);
  }
};
