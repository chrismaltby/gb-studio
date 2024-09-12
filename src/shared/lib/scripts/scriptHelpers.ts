// Helpers around script data

import {
  ScriptEventNormalized,
  ScriptEvent,
} from "shared/lib/entities/entitiesTypes";
import { walkNormalizedScript, walkScript } from "shared/lib/scripts/walk";
import isEqual from "lodash/isEqual";
import SparkMD5 from "spark-md5";

export const isEmptyScript = (script: ScriptEvent[]) => {
  if (script.length === 0) {
    return true;
  }
  return script.every((scriptEvent) => scriptEvent?.args?.__comment);
};

export const isNormalizedScriptEqual = (
  idsA: string[] = [],
  lookupA: Record<string, ScriptEventNormalized>,
  idsB: string[] = [],
  lookupB: Record<string, ScriptEventNormalized>
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

export const generateScriptHash = (script: ScriptEvent[]): string => {
  const data: unknown[] = [];
  walkScript(script, undefined, ({ args, command }) => {
    data.push({ args, command });
  });
  return SparkMD5.hash(JSON.stringify(data));
};
