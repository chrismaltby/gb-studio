import ValueSelect from "components/forms/ValueSelect";
import React from "react";
import type { ScriptValue } from "shared/lib/scriptValue/types";
import {
  VariableIndexBracket,
  VariableIndexInputGroup,
} from "./VariableIndexInput";

export { IndexedVariableInputGroup } from "./VariableIndexInput";
export { VariableInputGroup } from "./VariableIndexInput";

interface VariableIndexSelectProps {
  name: string;
  entityId: string;
  value?: ScriptValue;
  max?: number;
  onChange: (newValue: ScriptValue) => void;
}

export const VariableIndexSelect = ({
  name,
  entityId,
  value = { type: "number", value: 0 },
  max,
  onChange,
}: VariableIndexSelectProps) => (
  <VariableIndexInputGroup>
    <VariableIndexBracket $type="open" />
    <ValueSelect
      name={name}
      entityId={entityId}
      value={value}
      min={0}
      max={max}
      onChange={onChange}
      innerValue
    />
    <VariableIndexBracket $type="close" />
  </VariableIndexInputGroup>
);
