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

  // Exit early if script lengths differ
  if (scriptAEvents.length !== scriptBEvents.length) {
    return false;
  }
  // Otherwise check that every script event is equivalent
  for (let i = 0; i < scriptAEvents.length; i++) {
    const scriptEventA = scriptAEvents[i];
    const scriptEventB = scriptBEvents[i];
    if (scriptEventA.command !== scriptEventB.command) {
      return false;
    }
    if (!isArgsEqual(scriptEventA.args ?? {}, scriptEventB.args ?? {})) {
      return false;
    }
  }

  return true;
};

export const generateScriptHash = (script: ScriptEvent[]): string => {
  const data: unknown[] = [];
  walkScript(script, undefined, ({ args, command }) => {
    data.push({ args, command });
  });
  return SparkMD5.hash(JSON.stringify(data));
};

// Compare args with undefined and missing args as equivalent
const isArgsEqual = (
  a: Record<string, unknown>,
  b: Record<string, unknown>
): boolean => {
  const keys = new Set<string>([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const hasKeyA = Object.prototype.hasOwnProperty.call(a, key);
    const hasKeyB = Object.prototype.hasOwnProperty.call(b, key);
    const valA = a[key];
    const valB = b[key];

    if (hasKeyA && hasKeyB) {
      // Both objects have the key
      if (!isEqual(valA, valB)) {
        return false;
      }
    } else if (hasKeyA || hasKeyB) {
      // One object has the key; check if its value is undefined
      const val = hasKeyA ? valA : valB;
      if (val !== undefined) {
        // Values are different since one is not undefined
        return false;
      }
    }
  }
  return true;
};
