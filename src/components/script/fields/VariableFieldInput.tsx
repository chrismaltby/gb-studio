import React from "react";
import { VariableSelect } from "components/forms/VariableSelect";
import { Alert } from "ui/alerts/Alert";
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
} from "./fieldHelpers";
import { useVariableFieldContext } from "./useVariableFieldContext";
import l10n from "shared/lib/lang/l10n";
import { FixedSpacer } from "ui/spacing/Spacing";

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
  const { candidates } = useVariableFieldContext(entityId);
  const variableValue = isScriptValueVariable(value) ? value : undefined;
  const variableId =
    variableValue?.value ?? (typeof value === "string" ? value : "");
  const selectedCandidate = candidates.find(({ id }) => id === variableId);
  const isArray = selectedCandidate?.type === "array";
  const isArrayTooSmall =
    isArray &&
    selectedCandidate.size !== undefined &&
    field.arraySize !== undefined &&
    selectedCandidate.size < field.arraySize;
  const variableIndex = isScriptValue(variableValue?.index)
    ? variableValue.index
    : { type: "number" as const, value: 0 };

  return (
    <>
      <IndexedVariableInputGroup>
        <VariableInputGroup>
          <VariableSelect
            name={id}
            value={variableId}
            entityId={entityId}
            allowedVariableTypes={allowedVariableTypes}
            onChange={(newVariableId) => {
              const candidate = candidates.find(
                ({ id }) => id === newVariableId,
              );
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
            max={
              selectedCandidate?.size ? selectedCandidate.size - 1 : undefined
            }
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

      {isArrayTooSmall && (
        <>
          <FixedSpacer height={5} />
          <Alert variant="warning">
            {l10n("WARNING_ARRAY_TOO_SMALL", {
              expectedSize: field.arraySize,
              actualSize: selectedCandidate.size,
            })}
          </Alert>
        </>
      )}
    </>
  );
};
