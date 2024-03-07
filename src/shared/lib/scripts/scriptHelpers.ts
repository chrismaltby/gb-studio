// Helpers around script data

import { Dictionary } from "@reduxjs/toolkit";
import {
  ScriptEvent,
  ScriptEventDenormalized,
} from "shared/lib/entities/entitiesTypes";
import { walkNormalizedScript } from "shared/lib/scripts/walk";
import isEqual from "lodash/isEqual";

// Patching
// Editing
// Testing is empty
// Equality

export const isEmptyScript = (script: ScriptEventDenormalized[]) => {
  if (script.length === 0) {
    return true;
  }
  return script.every((scriptEvent) => scriptEvent?.args?.__comment);
};

export const isNormalisedScriptEqual = (
  idsA: string[] = [],
  lookupA: Dictionary<ScriptEvent>,
  idsB: string[] = [],
  lookupB: Dictionary<ScriptEvent>
) => {
  const scriptAEvents: { args?: Record<string, unknown>; command: string }[] =
    [];
  const scriptBEvents: { args?: Record<string, unknown>; command: string }[] =
    [];
  walkNormalizedScript(idsA, lookupA, undefined, (scriptEvent) => {
    const { args, command } = scriptEvent;
    scriptAEvents.push({ args, command });
  });
  walkNormalizedScript(idsB, lookupB, undefined, (scriptEvent) => {
    const { args, command } = scriptEvent;
    scriptBEvents.push({ args, command });
  });
  return isEqual(scriptAEvents, scriptBEvents);
};
