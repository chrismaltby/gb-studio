import type { ScriptEventFieldSchema } from "shared/lib/entities/entitiesTypes";
import type { VariableType } from "shared/lib/resources/types";
import type {
  ScriptValue,
  ScriptValueVariable,
} from "shared/lib/scriptValue/types";

type VariableFieldType = NonNullable<ScriptEventFieldSchema["variableType"]>;

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
