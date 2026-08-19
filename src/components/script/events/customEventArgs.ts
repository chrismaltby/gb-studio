import type { ScriptNormalized } from "shared/lib/entities/entitiesTypes";
import {
  defaultVariableValueForType,
  type VariableFieldCandidate,
} from "components/script/fields/fieldHelpers";

export const applyCustomEventArgDefaults = (
  customEvent: ScriptNormalized,
  args: Record<string, unknown>,
  variableCandidates: VariableFieldCandidate[],
  preferredVariableId?: string,
): Record<string, unknown> => {
  const nextArgs = { ...args };

  for (const variable of Object.values(customEvent.variables)) {
    const key = `$variable[${variable.id}]$`;
    if (nextArgs[key] !== undefined) {
      continue;
    }
    const variableType =
      variable.passByReference === "array" ? "arrayReference" : "any";
    const compatibleVariableCandidates =
      variable.passByReference === "array"
        ? variableCandidates.filter(
            (candidate) =>
              candidate.type === "array" &&
              candidate.length !== undefined &&
              candidate.length >= variable.length,
          )
        : variableCandidates;
    const defaultValue = defaultVariableValueForType(
      variableType,
      compatibleVariableCandidates,
      preferredVariableId,
    );
    if (defaultValue === undefined) {
      continue;
    }
    nextArgs[key] =
      typeof defaultValue === "string"
        ? { type: "variable", value: defaultValue }
        : defaultValue;
  }

  for (const actor of Object.values(customEvent.actors)) {
    const key = `$actor[${actor.id}]$`;
    if (nextArgs[key] === undefined) {
      nextArgs[key] = "player";
    }
  }

  return nextArgs;
};
