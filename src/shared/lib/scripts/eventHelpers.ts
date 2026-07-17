import { EVENT_FADE_IN } from "consts";
import type { ScriptEventDef } from "lib/scriptEventsHandlers/handlerTypes";
import { isUnionPropertyValue } from "shared/lib/entities/entitiesHelpers";
import type {
  ScriptEventNormalized,
  ScriptNormalized,
} from "shared/lib/entities/entitiesTypes";
import {
  Script,
  ScriptEvent,
  ScriptEventArgsOverride,
} from "shared/lib/resources/types";
import { walkNormalizedScript, walkScript } from "shared/lib/scripts/walk";

export type ScriptEventDefs = Record<string, ScriptEventDef>;

export const remapActorReferencesInEventArgs = (
  command: string,
  args: Record<string, unknown>,
  actorMapping: Record<string, string>,
  scriptEventDefs: ScriptEventDefs,
) => {
  const eventSchema = scriptEventDefs[command];

  if (!eventSchema) {
    return args;
  }

  const patchArgs = Object.keys(args).reduce(
    (memo, key) => {
      const field = eventSchema.fieldsLookup[key];
      const arg = args[key];

      if (field?.type === "actor" && typeof arg === "string") {
        const replacement = actorMapping[arg];
        if (replacement !== undefined) {
          memo[key] = replacement;
        }
      } else if (field && isUnionPropertyValue(arg)) {
        const propertyParts = (arg.value ?? "").split(":");
        const replacement = actorMapping[propertyParts[0]];
        if (propertyParts.length === 2 && replacement !== undefined) {
          memo[key] = {
            type: "property",
            value: `${replacement}:${propertyParts[1]}`,
          };
        }
      }
      return memo;
    },
    {} as Record<string, unknown>,
  );

  return {
    ...args,
    ...patchArgs,
  };
};

export const remapActorReferencesInEventOverrides = (
  eventOverrides: Record<string, ScriptEventArgsOverride> | null | undefined,
  scriptEventsLookup: Record<string, ScriptEventNormalized>,
  actorMapping: Record<string, string>,
  scriptEventDefs: ScriptEventDefs,
) => {
  if (!eventOverrides) {
    return eventOverrides;
  }

  return Object.fromEntries(
    Object.entries(eventOverrides).map(([scriptEventId, override]) => {
      const command = scriptEventsLookup[scriptEventId]?.command;

      return [
        scriptEventId,
        {
          ...override,
          args: command
            ? remapActorReferencesInEventArgs(
                command,
                override.args,
                actorMapping,
                scriptEventDefs,
              )
            : override.args,
        },
      ];
    }),
  );
};

export const calculateAutoFadeEventIdNormalized = (
  script: string[],
  scriptEventsLookup: Record<string, ScriptEventNormalized>,
  customEventsLookup: Record<string, ScriptNormalized>,
  scriptEventDefs: ScriptEventDefs,
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
      checkEvent(eventValue),
    );
    if (fadeEventId.length > 0) {
      break;
    }
  }
  return fadeEventId;
};

export const calculateAutoFadeEventId = (
  script: ScriptEvent[],
  customEventsLookup: Record<string, Script>,
  scriptEventDefs: ScriptEventDefs,
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
      checkEvent(scriptEvent.id),
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
