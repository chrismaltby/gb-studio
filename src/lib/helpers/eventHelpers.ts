import { Dictionary } from "@reduxjs/toolkit";
import { EVENT_FADE_IN } from "lib/compiler/eventTypes";
import { EventHandler } from "lib/events";
import { walkNormalisedScriptEvents } from "store/features/entities/entitiesHelpers";
import {
  ActorDenormalized,
  CustomEventDenormalized,
  SceneDenormalized,
  ScriptEvent,
  CustomEvent,
  ScriptEventDenormalized,
  TriggerDenormalized,
} from "store/features/entities/entitiesTypes";

type WalkDenormalizedOptions =
  | undefined
  | {
      filter?: (ScriptEvent: ScriptEventDenormalized) => boolean;
      customEvents?: {
        lookup: Dictionary<CustomEventDenormalized>;
        maxDepth: number;
        args?: Record<string, unknown>;
      };
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
    // If filter is provided skip events that fail filter
    if (options?.filter && !options.filter(scriptEvent)) {
      continue;
    }
    if (scriptEvent?.args?.__comment) {
      // Skip commented events
      continue;
    }
    callback(replaceCustomEventArgs(scriptEvent, options?.customEvents?.args));
    if (
      scriptEvent.children &&
      scriptEvent.command !== "EVENT_CALL_CUSTOM_EVENT"
    ) {
      Object.keys(scriptEvent.children).forEach((key) => {
        const script = scriptEvent.children?.[key];
        if (script) {
          walkDenormalizedEvents(script, options, callback);
        }
      });
    }
    if (
      options?.customEvents &&
      scriptEvent.command === "EVENT_CALL_CUSTOM_EVENT"
    ) {
      const customEvent =
        options.customEvents.lookup[
          String(scriptEvent.args?.customEventId || "")
        ];
      if (customEvent) {
        walkDenormalizedEvents(
          customEvent.script,
          {
            ...options,
            customEvents: {
              ...options.customEvents,
              maxDepth: options.customEvents.maxDepth - 1,
              args: scriptEvent.args || {},
            },
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

export const calculateAutoFadeEventIdNormalised = (
  script: string[],
  scriptEventsLookup: Dictionary<ScriptEvent>,
  customEventsLookup: Dictionary<CustomEvent>
) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const events = require("../events").default;
  let fadeEventId = "";
  const checkEvent = (eventId: string) => (scriptEvent: ScriptEvent) => {
    if (!fadeEventId && events[scriptEvent.command]?.waitUntilAfterInitFade) {
      if (scriptEvent.command === EVENT_FADE_IN) {
        fadeEventId = "MANUAL";
      } else {
        fadeEventId = eventId;
      }
    }
  };
  for (const eventValue of script) {
    const scriptEvent = scriptEventsLookup[eventValue];
    if (scriptEvent?.args?.__comment) {
      continue;
    }
    if (scriptEvent?.command === EVENT_FADE_IN) {
      fadeEventId = "MANUAL";
      break;
    }
    walkNormalisedScriptEvents(
      [eventValue],
      scriptEventsLookup,
      {
        customEvents: {
          lookup: customEventsLookup,
          maxDepth: 5,
        },
        filter: (childEvent) => {
          if (childEvent?.args?.__comment) {
            return false;
          }
          if (events[childEvent.command]?.allowChildrenBeforeInitFade) {
            return false;
          }
          return true;
        },
      },
      checkEvent(eventValue)
    );
    if (fadeEventId.length > 0) {
      break;
    }
  }
  return fadeEventId;
};

export const calculateAutoFadeEventIdDenormalised = (
  script: ScriptEventDenormalized[],
  customEventsLookup: Dictionary<CustomEventDenormalized>
) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const events = require("../events").default;
  let fadeEventId = "";
  const checkEvent =
    (eventId: string) => (scriptEvent: ScriptEventDenormalized) => {
      if (!fadeEventId && events[scriptEvent.command]?.waitUntilAfterInitFade) {
        if (scriptEvent.command === EVENT_FADE_IN) {
          fadeEventId = "MANUAL";
        } else {
          fadeEventId = eventId;
        }
      }
    };
  for (const scriptEvent of script) {
    if (scriptEvent?.args?.__comment) {
      continue;
    }
    if (scriptEvent?.command === EVENT_FADE_IN) {
      fadeEventId = "MANUAL";
      break;
    }
    walkDenormalizedEvents(
      [scriptEvent],
      {
        customEvents: {
          lookup: customEventsLookup,
          maxDepth: 5,
        },
        filter: (childEvent) => {
          if (childEvent?.args?.__comment) {
            return false;
          }
          if (events[childEvent.command]?.allowChildrenBeforeInitFade) {
            return false;
          }
          return true;
        },
      },
      checkEvent(scriptEvent.id)
    );
    if (fadeEventId.length > 0) {
      break;
    }
  }
  return fadeEventId;
};
