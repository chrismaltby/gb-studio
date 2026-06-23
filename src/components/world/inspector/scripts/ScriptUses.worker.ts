import {
  actorName,
  customEventName,
  sceneName,
  triggerName,
} from "shared/lib/entities/entitiesHelpers";
import {
  ActorNormalized,
  ActorPrefabNormalized,
  ScriptNormalized,
  SceneNormalized,
  ScriptEventNormalized,
  TriggerNormalized,
  TriggerPrefabNormalized,
} from "shared/lib/entities/entitiesTypes";
import { L10NLookup, setL10NData } from "shared/lib/lang/l10n";
import {
  walkNormalizedCustomEventScripts,
  walkNormalizedScenesScripts,
} from "shared/lib/scripts/walk";

export type ScriptUse = {
  id: string;
  name: string;
  event: ScriptEventNormalized;
} & (
  | {
      type: "scene";
      sceneId: string;
      scene: SceneNormalized;
      sceneIndex: number;
    }
  | {
      type: "actor";
      actor: ActorNormalized;
      actorIndex: number;
      sceneId: string;
      scene: SceneNormalized;
      sceneIndex: number;
    }
  | {
      type: "trigger";
      trigger: TriggerNormalized;
      triggerIndex: number;
      sceneId: string;
      scene: SceneNormalized;
      sceneIndex: number;
    }
  | {
      type: "custom";
      customEvent: ScriptNormalized;
      customEventIndex: number;
    }
);

export interface ScriptUseResult {
  id: string;
  uses: ScriptUse[];
}

// eslint-disable-next-line no-restricted-globals
const workerCtx: Worker = self as unknown as Worker;

workerCtx.onmessage = async (evt) => {
  const id = evt.data.id;
  const scriptId: string = evt.data.scriptId;
  const scenes: SceneNormalized[] = evt.data.scenes;
  const scriptEventsLookup: Record<string, ScriptEventNormalized> =
    evt.data.scriptEventsLookup;
  const actorsLookup: Record<string, ActorNormalized> = evt.data.actorsLookup;
  const triggersLookup: Record<string, TriggerNormalized> =
    evt.data.triggersLookup;
  const actorPrefabsLookup: Record<string, ActorPrefabNormalized> =
    evt.data.actorPrefabsLookup;
  const triggerPrefabsLookup: Record<string, TriggerPrefabNormalized> =
    evt.data.triggerPrefabsLookup;
  const customEventsLookup: Record<string, ScriptNormalized> =
    evt.data.customEventsLookup;
  const l10NData: L10NLookup = evt.data.l10NData;

  setL10NData(l10NData);

  const uses: ScriptUse[] = [];
  const useLookup: Record<string, boolean> = {};

  walkNormalizedScenesScripts(
    scenes,
    scriptEventsLookup,
    actorsLookup,
    triggersLookup,
    actorPrefabsLookup,
    triggerPrefabsLookup,
    undefined,
    (scriptEvent, scene, actor, trigger) => {
      if (
        scriptEvent.command !== "EVENT_CALL_CUSTOM_EVENT" ||
        !scriptEvent.args ||
        scriptEvent.args.customEventId !== scriptId
      ) {
        return;
      }

      if (!useLookup[scene.id]) {
        const sceneIndex = scenes.indexOf(scene);
        uses.push({
          id: scene.id,
          name: sceneName(scene, sceneIndex),
          event: scriptEvent,
          type: "scene",
          scene,
          sceneIndex,
          sceneId: scene.id,
        });
        useLookup[scene.id] = true;
      }

      if (actor && !useLookup[actor.id]) {
        const sceneIndex = scenes.indexOf(scene);
        const actorIndex = scene.actors.indexOf(actor.id);
        uses.push({
          id: actor.id,
          name: actorName(actor, actorIndex),
          event: scriptEvent,
          type: "actor",
          actor,
          actorIndex,
          scene,
          sceneIndex,
          sceneId: scene.id,
        });
        useLookup[actor.id] = true;
      }

      if (trigger && !useLookup[trigger.id]) {
        const sceneIndex = scenes.indexOf(scene);
        const triggerIndex = scene.triggers.indexOf(trigger.id);
        uses.push({
          id: trigger.id,
          name: triggerName(trigger, triggerIndex),
          event: scriptEvent,
          type: "trigger",
          trigger,
          triggerIndex,
          scene,
          sceneIndex,
          sceneId: scene.id,
        });
        useLookup[trigger.id] = true;
      }
    },
  );

  Object.values(customEventsLookup).forEach((customEvent, customEventIndex) => {
    if (!customEvent) return;
    walkNormalizedCustomEventScripts(
      customEvent,
      scriptEventsLookup,
      undefined,
      (scriptEvent: ScriptEventNormalized) => {
        if (
          scriptEvent.command !== "EVENT_CALL_CUSTOM_EVENT" ||
          !scriptEvent.args ||
          scriptEvent.args.customEventId !== scriptId
        ) {
          return;
        }

        if (!useLookup[customEvent.id]) {
          uses.push({
            id: customEvent.id,
            name: customEventName(customEvent, customEventIndex),
            event: scriptEvent,
            type: "custom",
            customEvent,
            customEventIndex: customEventIndex,
          });
          useLookup[customEvent.id] = true;
        }
      },
    );
  });

  workerCtx.postMessage({ id, uses } as ScriptUseResult);
};

// -----------------------------------------------------------------

export default class W extends Worker {
  constructor() {
    super("");
  }
}
