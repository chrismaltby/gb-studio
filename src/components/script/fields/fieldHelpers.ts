import type { ScriptEventFieldSchema } from "shared/lib/entities/entitiesTypes";
import type { VariableType } from "shared/lib/resources/types";
import type {
  ScriptValue,
  ScriptValueVariable,
} from "shared/lib/scriptValue/types";

type VariableFieldType = NonNullable<ScriptEventFieldSchema["variableType"]>;

export interface VariableFieldCandidate {
  id: string;
  type: VariableType;
}

const arrayVariableTypes: VariableType[] = ["array"];

export const allowedVariableTypesForFieldType = (
  type: VariableFieldType,
): VariableType[] | undefined =>
  type === "any" ? undefined : arrayVariableTypes;

export const variableTypeAllowsIndex = (type: VariableFieldType): boolean =>
  type !== "arrayReference";

export const variableValueForType = (
  type: VariableFieldType,
  variableId: string,
  index: ScriptValue,
  isArray: boolean,
): string | ScriptValueVariable => {
  if (type === "arrayReference") {
    return {
      type: "variable",
      value: variableId,
    };
  }
  if (type === "arrayElement" || isArray) {
    return {
      type: "variable",
      value: variableId,
      index,
    };
  }
  return variableId;
};

export const defaultVariableValueForType = (
  type: VariableFieldType,
  candidates: VariableFieldCandidate[],
  preferredVariableId?: string,
): string | ScriptValueVariable | undefined => {
  const allowedTypes = allowedVariableTypesForFieldType(type);
  const compatibleCandidates = candidates.filter(
    (candidate) => !allowedTypes || allowedTypes.includes(candidate.type),
  );
  const candidate =
    compatibleCandidates.find(({ id }) => id === preferredVariableId) ??
    compatibleCandidates[0];
  if (!candidate) {
    return undefined;
  }
  return variableValueForType(
    type,
    candidate.id,
    { type: "number", value: 0 },
    candidate.type === "array",
  );
};

export const defaultValueForUnionType = (
  field: ScriptEventFieldSchema,
  type: string,
  defaultVariableId: string,
): unknown => {
  const defaultValue =
    typeof field.defaultValue === "object" && field.defaultValue !== null
      ? (field.defaultValue as Record<string, unknown>)[type]
      : undefined;

  return defaultValue === "LAST_VARIABLE" ? defaultVariableId : defaultValue;
};
