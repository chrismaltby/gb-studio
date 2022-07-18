import { Dictionary } from "@reduxjs/toolkit";
import { EventLookup, isVariableField } from "lib/helpers/eventSystem";
import {
  actorName,
  isUnionValue,
  sceneName,
  triggerName,
  walkNormalisedActorEvents,
  walkNormalisedSceneSpecificEvents,
  walkNormalisedTriggerEvents,
} from "store/features/entities/entitiesHelpers";
import {
  Actor,
  Scene,
  ScriptEvent,
  Trigger,
} from "store/features/entities/entitiesTypes";

export type VariableUse = {
  id: string;
  name: string;
  sceneId: string;
  scene: Scene;
  sceneIndex: number;
  event: ScriptEvent;
} & (
  | {
      type: "scene";
    }
  | {
      type: "actor";
      actor: Actor;
      actorIndex: number;
      scene: Scene;
      sceneIndex: number;
    }
  | {
      type: "trigger";
      trigger: Trigger;
      triggerIndex: number;
      scene: Scene;
      sceneIndex: number;
    }
);

export interface VariableUseResult {
  id: string;
  uses: VariableUse[];
}

// eslint-disable-next-line no-restricted-globals
const workerCtx: Worker = self as unknown as Worker;

const onVariableEventContainingId =
  (
    id: string,
    eventLookup: EventLookup,
    callback: (event: ScriptEvent) => void
  ) =>
  (event: ScriptEvent) => {
    if (event.args) {
      for (const arg in event.args) {
        if (isVariableField(event.command, arg, event.args, eventLookup)) {
          const argValue = event.args[arg];
          if (
            argValue === id ||
            (isUnionValue(argValue) &&
              argValue.type === "variable" &&
              argValue.value === id)
          ) {
            callback(event);
          }
        }
      }
    }
  };

workerCtx.onmessage = async (evt) => {
  const id = evt.data.id;
  const variableId: string = evt.data.variableId;
  const scenes: Scene[] = evt.data.scenes;
  const scriptEventsLookup: Dictionary<ScriptEvent> =
    evt.data.scriptEventsLookup;
  const actorsLookup: Dictionary<Actor> = evt.data.actorsLookup;
  const triggersLookup: Dictionary<Trigger> = evt.data.triggersLookup;
  const eventsLookup: EventLookup = evt.data.eventLookup;

  const uses: VariableUse[] = [];
  const useLookup: Dictionary<boolean> = {};

  for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex++) {
    const scene = scenes[sceneIndex];
    walkNormalisedSceneSpecificEvents(
      scene,
      scriptEventsLookup,
      undefined,
      onVariableEventContainingId(
        variableId,
        eventsLookup,
        (event: ScriptEvent) => {
          if (!useLookup[scene.id]) {
            uses.push({
              id: scene.id,
              name: sceneName(scene, sceneIndex),
              event,
              type: "scene",
              scene,
              sceneIndex,
              sceneId: scene.id,
            });
            useLookup[scene.id] = true;
          }
        }
      )
    );
    for (let actorIndex = 0; actorIndex < scenes.length; actorIndex++) {
      const actorId = scene.actors[actorIndex];
      const actor = actorsLookup[actorId];
      if (actor) {
        walkNormalisedActorEvents(
          actor,
          scriptEventsLookup,
          undefined,
          onVariableEventContainingId(
            variableId,
            eventsLookup,
            (event: ScriptEvent) => {
              if (!useLookup[scene.id]) {
                uses.push({
                  id: scene.id,
                  name: sceneName(scene, sceneIndex),
                  event,
                  type: "scene",
                  scene,
                  sceneIndex,
                  sceneId: scene.id,
                });
                useLookup[scene.id] = true;
              }
              if (!useLookup[actor.id]) {
                uses.push({
                  id: actor.id,
                  name: actorName(actor, actorIndex),
                  event,
                  type: "actor",
                  actor,
                  actorIndex,
                  scene,
                  sceneIndex,
                  sceneId: scene.id,
                });
                useLookup[actor.id] = true;
              }
            }
          )
        );
      }
    }
    for (let triggerIndex = 0; triggerIndex < scenes.length; triggerIndex++) {
      const triggerId = scene.triggers[triggerIndex];
      const trigger = triggersLookup[triggerId];
      if (trigger) {
        walkNormalisedTriggerEvents(
          trigger,
          scriptEventsLookup,
          undefined,
          onVariableEventContainingId(
            variableId,
            eventsLookup,
            (event: ScriptEvent) => {
              if (!useLookup[scene.id]) {
                uses.push({
                  id: scene.id,
                  name: sceneName(scene, sceneIndex),
                  event,
                  type: "scene",
                  scene,
                  sceneIndex,
                  sceneId: scene.id,
                });
                useLookup[scene.id] = true;
              }
              if (!useLookup[trigger.id]) {
                uses.push({
                  id: trigger.id,
                  name: triggerName(trigger, triggerIndex),
                  event,
                  type: "trigger",
                  trigger,
                  triggerIndex,
                  scene,
                  sceneIndex,
                  sceneId: scene.id,
                });
                useLookup[trigger.id] = true;
              }
            }
          )
        );
      }
    }
  }

  workerCtx.postMessage({ id, uses } as VariableUseResult);
};

// -----------------------------------------------------------------

export default class W extends Worker {
  constructor() {
    super("");
  }
}
