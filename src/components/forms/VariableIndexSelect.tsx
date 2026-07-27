import { VariableSelect } from "components/forms/VariableSelect";
import React from "react";
import l10n from "shared/lib/lang/l10n";
import type { VariableIndex } from "shared/lib/scriptValue/types";
import { DropdownButton } from "ui/buttons/DropdownButton";
import {
  InputGroup,
  InputGroupLabel,
  InputGroupPrepend,
} from "ui/form/InputGroup";
import { NumberInput } from "ui/form/NumberInput";
import { CheckIcon, BlankIcon } from "ui/icons/Icons";
import { MenuItem } from "ui/menu/Menu";

interface VariableIndexSelectProps {
  name: string;
  entityId: string;
  value?: VariableIndex;
  max?: number;
  onChange: (newValue: VariableIndex) => void;
}

export const VariableIndexSelect = ({
  name,
  entityId,
  value = { type: "number", value: 0 },
  max,
  onChange,
}: VariableIndexSelectProps) => {
  const onChangeType = (type: VariableIndex["type"]) => {
    if (type === "number") {
      onChange({ type: "number", value: 0 });
    } else {
      onChange({ type: "variable", value: "0" });
    }
  };

  return (
    <InputGroup>
      <InputGroupPrepend>
        <InputGroupLabel>[</InputGroupLabel>
      </InputGroupPrepend>
      <DropdownButton
        variant="transparent"
        size="small"
        showArrow={false}
        label={value.type === "number" ? "#" : "$"}
      >
        <MenuItem
          icon={value.type === "number" ? <CheckIcon /> : <BlankIcon />}
          onClick={() => onChangeType("number")}
        >
          {l10n("FIELD_NUMBER")}
        </MenuItem>
        <MenuItem
          icon={value.type === "variable" ? <CheckIcon /> : <BlankIcon />}
          onClick={() => onChangeType("variable")}
        >
          {l10n("FIELD_VARIABLE")}
        </MenuItem>
      </DropdownButton>
      {value.type === "number" ? (
        <NumberInput
          id={name}
          value={value.value}
          min={0}
          max={max}
          step={1}
          onChange={(event) => {
            const nextValue = Math.max(
              0,
              Number(event.currentTarget.value) || 0,
            );
            onChange({
              type: "number",
              value: max === undefined ? nextValue : Math.min(max, nextValue),
            });
          }}
        />
      ) : (
        <VariableSelect
          name={name}
          entityId={entityId}
          value={value.value}
          onChange={(newValue) => {
            onChange({ type: "variable", value: newValue });
          }}
        />
      )}
      <InputGroupLabel>]</InputGroupLabel>
    </InputGroup>
  );
};
