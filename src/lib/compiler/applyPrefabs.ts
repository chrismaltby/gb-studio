import { keyBy } from "lodash";
import { ProjectResources, ScriptEvent } from "shared/lib/resources/types";
import { mapActorScript, mapTriggerScript } from "shared/lib/scripts/walk";

export const applyPrefabs = (
  projectData: ProjectResources,
): ProjectResources => {
  const actorPrefabsLookup = keyBy(projectData.actorPrefabs, "id");
  const triggerPrefabsLookup = keyBy(projectData.triggerPrefabs, "id");

  return {
    ...projectData,
    scenes: projectData.scenes.map((scene) => ({
      ...scene,
      actors: scene.actors.map((actor) => {
        const prefab = actorPrefabsLookup[actor.prefabId];
        if (!prefab) {
          return actor;
        }
        const applyScriptEventOverrides = (
          scriptEvent: ScriptEvent,
        ): ScriptEvent => {
          const override = actor.prefabScriptOverrides[scriptEvent.id];
          if (!override) {
            return scriptEvent;
          }
          return {
            ...scriptEvent,
            args: {
              ...scriptEvent.args,
              ...override.args,
            },
          };
        };
        return {
          ...actor,
          ...mapActorScript(prefab, applyScriptEventOverrides),
          _resourceType: actor._resourceType,
          id: actor.id,
        };
      }),
      triggers: scene.triggers.map((trigger) => {
        const prefab = triggerPrefabsLookup[trigger.prefabId];
        if (!prefab) {
          return trigger;
        }
        const applyScriptEventOverrides = (
          scriptEvent: ScriptEvent,
        ): ScriptEvent => {
          const override = trigger.prefabScriptOverrides[scriptEvent.id];
          if (!override) {
            return scriptEvent;
          }
          return {
            ...scriptEvent,
            args: {
              ...scriptEvent.args,
              ...override.args,
            },
          };
        };
        return {
          ...trigger,
          ...mapTriggerScript(prefab, applyScriptEventOverrides),
          _resourceType: trigger._resourceType,
          id: trigger.id,
        };
      }),
    })),
  };
};
