import { Dictionary } from "@reduxjs/toolkit";
import { EventHandler } from "lib/events";
import {
  ActorDenormalized,
  CustomEventDenormalized,
  SceneDenormalized,
  ScriptEventDenormalized,
  TriggerDenormalized,
} from "store/features/entities/entitiesTypes";

type WalkDenormalizedOptions =
  | undefined
  | {
      customEventsLookup: Dictionary<CustomEventDenormalized>;
      maxDepth: number;
      customEventArgs: Record<string, unknown>;
    };

export const patchEventArgs = (
  command: string,
  type: string,
  args: Record<string, unknown>,
  replacements: Record<string, unknown>
) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const events = require("../events").default;
  const eventSchema: EventHandler = events[command];

  if (!eventSchema) {
    return args;
  }

  const patchArgs: Record<string, unknown> = {};
  eventSchema.fields.forEach((field) => {
    if (field.type === type) {
      if (replacements[args[field.key] as string]) {
        patchArgs[field.key] = replacements[args[field.key] as string];
      }
    } else if (
      type === "actor" &&
      (args[field.key] as { type?: string })?.type === "property"
    ) {
      const propertyParts = (
        (args[field.key] as { value?: string })?.value || ""
      ).split(":");
      if (propertyParts.length === 2) {
        patchArgs[field.key] = {
          type: "property",
          value: `${replacements[propertyParts[0]]}:${propertyParts[1]}`,
        };
      }
    }
  });

  return {
    ...args,
    ...patchArgs,
  };
};

export const replaceCustomEventArgs = (
  scriptEvent: ScriptEventDenormalized,
  customEventArgs: Record<string, unknown> | undefined
) => {
  if (!customEventArgs) {
    return scriptEvent;
  }
  return {
    ...scriptEvent,
    args: {
      ...scriptEvent.args,
      actorId:
        customEventArgs[`$actor[${scriptEvent.args?.actorId || 0}]$`] ??
        "$self$",
      // @todo Replace other custom event fields
    },
  };
};

export const walkDenormalizedEvents = (
  script: ScriptEventDenormalized[],
  options: WalkDenormalizedOptions,
  callback: (event: ScriptEventDenormalized) => void
) => {
  if (!script) {
    return;
  }
  for (let i = 0; i < script.length; i++) {
    const scriptEvent = script[i];
    if (scriptEvent?.args?.__comment) {
      // Skip commented events
      continue;
    }
    callback(replaceCustomEventArgs(scriptEvent, options?.customEventArgs));
    if (scriptEvent.children) {
      Object.keys(scriptEvent.children).forEach((key) => {
        const script = scriptEvent.children?.[key];
        if (script) {
          walkDenormalizedEvents(script, options, callback);
        }
      });
    }
    if (
      options?.customEventsLookup &&
      scriptEvent.command === "EVENT_CALL_CUSTOM_EVENT"
    ) {
      const customEvent =
        options.customEventsLookup[
          String(scriptEvent.args?.customEventId || "")
        ];
      if (customEvent) {
        walkDenormalizedEvents(
          customEvent.script,
          {
            ...options,
            maxDepth: options.maxDepth - 1,
            customEventArgs: scriptEvent.args || {},
          },
          callback
        );
      }
    }
  }
};

export const walkDenormalizedActorEvents = (
  actor: ActorDenormalized,
  options: WalkDenormalizedOptions,

  callback: (event: ScriptEventDenormalized) => void
) => {
  const walk = (script: ScriptEventDenormalized[]) => {
    walkDenormalizedEvents(script, options, callback);
  };
  walk(actor.script);
  walk(actor.startScript);
  walk(actor.updateScript);
  walk(actor.hit1Script);
  walk(actor.hit2Script);
  walk(actor.hit3Script);
};

export const walkDenormalizedTriggerEvents = (
  trigger: TriggerDenormalized,
  options: WalkDenormalizedOptions,

  callback: (event: ScriptEventDenormalized) => void
) => {
  const walk = (script: ScriptEventDenormalized[]) => {
    walkDenormalizedEvents(script, options, callback);
  };
  walk(trigger.script);
  walk(trigger.leaveScript);
};

export const walkDenormalizedSceneSpecificEvents = (
  scene: SceneDenormalized,
  options: WalkDenormalizedOptions,

  callback: (event: ScriptEventDenormalized) => void
) => {
  const walk = (script: ScriptEventDenormalized[]) => {
    walkDenormalizedEvents(script, options, callback);
  };
  walk(scene.script);
  walk(scene.playerHit1Script);
  walk(scene.playerHit2Script);
  walk(scene.playerHit3Script);
};

export const walkDenormalizedSceneEvents = (
  scene: SceneDenormalized,
  options: WalkDenormalizedOptions,
  callback: (
    event: ScriptEventDenormalized,
    scene: SceneDenormalized,
    actor?: ActorDenormalized,
    trigger?: TriggerDenormalized
  ) => void
) => {
  walkDenormalizedSceneSpecificEvents(scene, options, (e) =>
    callback(e, scene, undefined, undefined)
  );
  scene.actors.forEach((actor) => {
    walkDenormalizedActorEvents(actor, options, (e) =>
      callback(e, scene, actor, undefined)
    );
  });
  scene.triggers.forEach((trigger) => {
    walkDenormalizedTriggerEvents(trigger, options, (e) =>
      callback(e, scene, undefined, trigger)
    );
  });
};

export const walkDenormalizedScenesEvents = (
  scenes: SceneDenormalized[],
  options: WalkDenormalizedOptions,
  callback: (event: ScriptEventDenormalized) => void
) => {
  scenes.forEach((scene) => {
    walkDenormalizedSceneEvents(scene, options, callback);
  });
};
