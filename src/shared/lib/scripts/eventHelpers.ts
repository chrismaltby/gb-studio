import { Dictionary } from "@reduxjs/toolkit";
import { EVENT_FADE_IN } from "consts";
import type { ScriptEventDef } from "lib/project/loadScriptEventHandlers";
import type {
  CustomEvent,
  ScriptEventNormalized,
  CustomEventNormalized,
  ScriptEvent,
} from "shared/lib/entities/entitiesTypes";
import { walkNormalizedScript, walkScript } from "shared/lib/scripts/walk";

export type ScriptEventDefs = Dictionary<ScriptEventDef>;

export const patchEventArgs = (
  command: string,
  type: string,
  args: Record<string, unknown>,
  replacements: Record<string, unknown>,
  scriptEventDefs: ScriptEventDefs
) => {
  const events = scriptEventDefs;
  const eventSchema = events[command];

  if (!eventSchema) {
    return args;
  }

  const patchArgs: Record<string, unknown> = {};
  eventSchema.fields.forEach((field) => {
    const key = field.key ?? "";
    if (field.type === type) {
      if (replacements[args[key] as string]) {
        patchArgs[key] = replacements[args[key] as string];
      }
    } else if (
      type === "actor" &&
      (args[key] as { type?: string })?.type === "property"
    ) {
      const propertyParts = (
        (args[key] as { value?: string })?.value || ""
      ).split(":");
      if (propertyParts.length === 2) {
        patchArgs[key] = {
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

export const calculateAutoFadeEventIdNormalized = (
  script: string[],
  scriptEventsLookup: Dictionary<ScriptEventNormalized>,
  customEventsLookup: Dictionary<CustomEventNormalized>,
  scriptEventDefs: ScriptEventDefs
) => {
  const events = scriptEventDefs;
  let fadeEventId = "";
  const checkEvent =
    (eventId: string) => (scriptEvent: ScriptEventNormalized) => {
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
    walkNormalizedScript(
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

export const calculateAutoFadeEventId = (
  script: ScriptEvent[],
  customEventsLookup: Dictionary<CustomEvent>,
  scriptEventDefs: ScriptEventDefs
) => {
  const events = scriptEventDefs;
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
  for (const scriptEvent of script) {
    if (scriptEvent?.args?.__comment) {
      continue;
    }
    if (scriptEvent?.command === EVENT_FADE_IN) {
      fadeEventId = "MANUAL";
      break;
    }
    walkScript(
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

export const isEmptyScript = (script: ScriptEvent[]) => {
  if (script.length === 0) {
    return true;
  }
  return script.every((scriptEvent) => scriptEvent?.args?.__comment);
};
