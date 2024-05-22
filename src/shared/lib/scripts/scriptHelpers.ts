// Helpers around script data

import { Dictionary } from "@reduxjs/toolkit";
import {
  ScriptEventNormalized,
  ScriptEvent,
} from "shared/lib/entities/entitiesTypes";
import { walkNormalizedScript } from "shared/lib/scripts/walk";
import isEqual from "lodash/isEqual";

export const isEmptyScript = (script: ScriptEvent[]) => {
  if (script.length === 0) {
    return true;
  }
  return script.every((scriptEvent) => scriptEvent?.args?.__comment);
};

export const isNormalizedScriptEqual = (
  idsA: string[] = [],
  lookupA: Dictionary<ScriptEventNormalized>,
  idsB: string[] = [],
  lookupB: Dictionary<ScriptEventNormalized>
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
