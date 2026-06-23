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
import tokenizer from "shared/lib/rpn/tokenizer";
import {
  ScriptEventDefs,
  isScriptValueField,
} from "shared/lib/scripts/scriptDefHelpers";
import {
  walkNormalizedCustomEventScripts,
  walkNormalizedScenesScripts,
} from "shared/lib/scripts/walk";
import { constantInScriptValue } from "shared/lib/scriptValue/helpers";
import { isScriptValue } from "shared/lib/scriptValue/types";

export type ConstantUse = {
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

export interface ConstantUseResult {
  id: string;
  uses: ConstantUse[];
}

// eslint-disable-next-line no-restricted-globals
const workerCtx: Worker = self as unknown as Worker;

workerCtx.onmessage = async (evt) => {
  const id = evt.data.id;
  const constantId: string = evt.data.constantId;
  const scenes: SceneNormalized[] = evt.data.scenes;
  const scriptEventsLookup: Record<string, ScriptEventNormalized> =
    evt.data.scriptEventsLookup;
  const actorsLookup: Record<string, ActorNormalized> = evt.data.actorsLookup;
  const triggersLookup: Record<string, TriggerNormalized> =
    evt.data.triggersLookup;
  const scriptEventDefs: ScriptEventDefs = evt.data.scriptEventDefs;
  const actorPrefabsLookup: Record<string, ActorPrefabNormalized> =
    evt.data.actorPrefabsLookup;
  const triggerPrefabsLookup: Record<string, TriggerPrefabNormalized> =
    evt.data.triggerPrefabsLookup;
  const customEventsLookup: Record<string, ScriptNormalized> =
    evt.data.customEventsLookup;
  const l10NData: L10NLookup = evt.data.l10NData;

  setL10NData(l10NData);

  const uses: ConstantUse[] = [];
  const useLookup: Record<string, boolean> = {};

  const isConstantInArg = (
    scriptEvent: ScriptEventNormalized,
    arg: string,
  ): boolean => {
    const args = scriptEvent.args;
    if (!args) {
      return false;
    }
    const argValue = args[arg];
    const field = scriptEventDefs[scriptEvent.command]?.fieldsLookup?.[arg];
    if (!field) {
      return false;
    }
    if (isScriptValueField(scriptEvent.command, arg, args, scriptEventDefs)) {
      if (
        isScriptValue(argValue) &&
        constantInScriptValue(constantId, argValue)
      ) {
        return true;
      }
    } else if (field.type === "matharea" && typeof argValue === "string") {
      const expressionTokens = tokenizer(argValue);
      if (
        expressionTokens.some(
          (token) =>
            token.type === "CONST" &&
            token.symbol.replace(/@/g, "") === constantId,
        )
      ) {
        return true;
      }
    }

    return false;
  };

  walkNormalizedScenesScripts(
    scenes,
    scriptEventsLookup,
    actorsLookup,
    triggersLookup,
    actorPrefabsLookup,
    triggerPrefabsLookup,
    undefined,
    (scriptEvent, scene, actor, trigger) => {
      if (!scriptEvent.args) {
        return;
      }

      // If already found this actor skip it
      if (actor && useLookup[actor.id] && useLookup[scene.id]) {
        return;
      }

      // If already found this trigger skip it
      if (trigger && useLookup[trigger.id] && useLookup[scene.id]) {
        return;
      }

      // If already found this scene skip it
      if (!actor && !trigger && useLookup[scene.id]) {
        return;
      }

      for (const arg in scriptEvent.args) {
        if (!isConstantInArg(scriptEvent, arg)) {
          continue;
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
        if (!scriptEvent.args) {
          return;
        }

        // If already found this script skip it
        if (useLookup[customEvent.id]) {
          return;
        }

        for (const arg in scriptEvent.args) {
          if (!isConstantInArg(scriptEvent, arg)) {
            continue;
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
        }
      },
    );
  });

  workerCtx.postMessage({ id, uses } as ConstantUseResult);
};

// -----------------------------------------------------------------

export default class W extends Worker {
  constructor() {
    super("");
  }
}
