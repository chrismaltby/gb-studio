import { ConstantSelect } from "components/forms/ConstantSelect";
import { VariableSelect } from "components/forms/VariableSelect";
import { ScriptEditorContext } from "components/script/context/ScriptEditorContext";
import React, { useContext, useMemo } from "react";
import l10n from "shared/lib/lang/l10n";
import type { VariableIndex } from "shared/lib/scriptValue/types";
import {
  constantSelectors,
  customEventSelectors,
  variableSelectors,
} from "store/features/entities/entitiesSelectors";
import { useAppSelector } from "store/hooks";
import { namedVariablesByContext } from "renderer/lib/variables";
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
  const context = useContext(ScriptEditorContext);
  const variablesLookup = useAppSelector((state) =>
    variableSelectors.selectEntities(state),
  );
  const customEvent = useAppSelector((state) =>
    customEventSelectors.selectById(state, entityId),
  );
  const constants = useAppSelector((state) =>
    constantSelectors.selectAll(state),
  );
  const engineConstants = useAppSelector((state) => state.engine.consts);
  const defaultVariableId = useMemo(
    () =>
      namedVariablesByContext(context, variablesLookup, customEvent).find(
        ({ id }) => variablesLookup[id]?.type !== "array",
      )?.id,
    [context, customEvent, variablesLookup],
  );
  const defaultConstantId =
    constants[0]?.id ??
    (engineConstants && Object.keys(engineConstants).length > 0
      ? `engine::${Object.keys(engineConstants).sort()[0]}`
      : undefined);

  const onChangeType = (type: VariableIndex["type"]) => {
    if (type === "number") {
      onChange({ type: "number", value: 0 });
    } else if (type === "variable" && defaultVariableId) {
      onChange({ type: "variable", value: defaultVariableId });
    } else if (type === "constant" && defaultConstantId) {
      onChange({ type: "constant", value: defaultConstantId });
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
        label={
          value.type === "number" ? "#" : value.type === "variable" ? "$" : "@"
        }
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
        <MenuItem
          icon={value.type === "constant" ? <CheckIcon /> : <BlankIcon />}
          onClick={() => onChangeType("constant")}
        >
          {l10n("FIELD_CONSTANT")}
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
      ) : value.type === "variable" ? (
        <VariableSelect
          name={name}
          entityId={entityId}
          value={value.value}
          onChange={(newValue) => {
            onChange({ type: "variable", value: newValue });
          }}
        />
      ) : (
        <ConstantSelect
          name={name}
          value={value.value}
          onChange={(newValue) => {
            onChange({ type: "constant", value: newValue });
          }}
        />
      )}
      <InputGroupLabel>]</InputGroupLabel>
    </InputGroup>
  );
};
