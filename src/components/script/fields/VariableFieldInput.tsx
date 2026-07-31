import React from "react";
import { VariableSelect } from "components/forms/VariableSelect";
import {
  IndexedVariableInputGroup,
  VariableInputGroup,
  VariableIndexSelect,
} from "components/forms/VariableIndexSelect";
import type { ScriptEventFieldSchema } from "shared/lib/entities/entitiesTypes";
import {
  isScriptValue,
  isScriptValueVariable,
} from "shared/lib/scriptValue/types";
import {
  allowedVariableTypesForFieldType,
  variableTypeAllowsIndex,
  variableValueForType,
} from "./variableFieldType";
import { useVariableFieldContext } from "./useVariableFieldContext";

interface VariableFieldInputProps {
  id: string;
  entityId: string;
  field: ScriptEventFieldSchema;
  value: unknown;
  allowRename: boolean;
  onChange: (value: unknown) => void;
}

export const VariableFieldInput = ({
  id,
  entityId,
  field,
  value,
  allowRename,
  onChange,
}: VariableFieldInputProps) => {
  const fieldVariableType = field.variableType ?? "any";
  const allowedVariableTypes =
    allowedVariableTypesForFieldType(fieldVariableType);
  const { candidates, variablesLookup } = useVariableFieldContext(entityId);
  const variableValue = isScriptValueVariable(value) ? value : undefined;
  const variableId =
    variableValue?.value ?? (typeof value === "string" ? value : "");
  const selectedCandidate = candidates.find(({ id }) => id === variableId);
  const isArray = selectedCandidate?.type === "array";
  const variableIndex = isScriptValue(variableValue?.index)
    ? variableValue.index
    : { type: "number" as const, value: 0 };
  const variable = variablesLookup[variableId];

  return (
    <IndexedVariableInputGroup>
      <VariableInputGroup>
        <VariableSelect
          name={id}
          value={variableId}
          entityId={entityId}
          allowedVariableTypes={allowedVariableTypes}
          onChange={(newVariableId) => {
            const candidate = candidates.find(({ id }) => id === newVariableId);
            onChange(
              variableValueForType(
                fieldVariableType,
                newVariableId,
                variableIndex,
                candidate?.type === "array",
              ),
            );
          }}
          allowRename={allowRename}
        />
      </VariableInputGroup>
      {variableTypeAllowsIndex(fieldVariableType) && isArray && (
        <VariableIndexSelect
          name={`${id}_index`}
          entityId={entityId}
          value={variableIndex}
          max={variable?.type === "array" ? variable.size - 1 : undefined}
          onChange={(newIndex) => {
            onChange({
              type: "variable",
              value: variableId,
              index: newIndex,
            });
          }}
        />
      )}
    </IndexedVariableInputGroup>
  );
};
