import { ConstantSelect } from "components/forms/ConstantSelect";
import {
  VariableSelect,
  VariableSelectWrapper,
} from "components/forms/VariableSelect";
import { ScriptEditorContext } from "components/script/context/ScriptEditorContext";
import React, { useCallback, useContext, useMemo } from "react";
import styled from "styled-components";
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
import { InputGroupPrepend } from "ui/form/InputGroup";
import { NumberInput } from "ui/form/NumberInput";
import { StyledInput } from "ui/form/style";
import {
  BlankIcon,
  CheckIcon,
  ConstantIcon,
  NumberIcon,
  VariableIcon,
} from "ui/icons/Icons";
import { MenuAccelerator, MenuItem } from "ui/menu/Menu";

const VariableIndexBracket = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 5px;
  box-sizing: border-box;
  font-size: 12px;
  font-weight: bold;
  color: ${(props) => props.theme.colors.input.text};
`;

const VariableIndexInputGroup = styled.div`
  display: flex;
  width: auto;
  min-width: min-content;
  flex: 1 1 160px;

  > ${InputGroupPrepend} + * .CustomSelect__control,
  > ${InputGroupPrepend} + * ${StyledInput} {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
`;

export const IndexedVariableInputGroup = styled.div`
  display: flex;
  width: 100%;
  min-width: 200px;

  > ${InputGroupPrepend} + ${VariableSelectWrapper} .CustomSelect__control {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }

  > ${VariableSelectWrapper} {
    width: auto;
    flex: 3 1 160px;
  }

  > ${VariableIndexInputGroup} {
    flex: 2 1 160px;
  }
`;

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

  const onChangeType = useCallback(
    (type: VariableIndex["type"]) => {
      if (type === "number") {
        onChange({ type: "number", value: 0 });
      } else if (type === "variable" && defaultVariableId) {
        onChange({ type: "variable", value: defaultVariableId });
      } else if (type === "constant" && defaultConstantId) {
        onChange({ type: "constant", value: defaultConstantId });
      }
    },
    [defaultConstantId, defaultVariableId, onChange],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.metaKey || event.ctrlKey) {
        return false;
      }
      if (event.key === "n") {
        onChangeType("number");
      } else if (event.key === "$") {
        onChangeType("variable");
      } else if (event.key === "c") {
        onChangeType("constant");
      } else {
        return false;
      }
      event.preventDefault();
      event.stopPropagation();
      return true;
    },
    [onChangeType],
  );

  const currentTypeLabel =
    value.type === "number"
      ? l10n("FIELD_NUMBER")
      : value.type === "variable"
        ? l10n("FIELD_VARIABLE")
        : l10n("FIELD_CONSTANT");

  return (
    <VariableIndexInputGroup>
      <VariableIndexBracket>[</VariableIndexBracket>
      <InputGroupPrepend>
        <DropdownButton
          variant="normal"
          size="small"
          showArrow={false}
          title={currentTypeLabel}
          onKeyDown={onKeyDown}
          label={
            value.type === "number" ? (
              <NumberIcon />
            ) : value.type === "variable" ? (
              <VariableIcon />
            ) : (
              <ConstantIcon />
            )
          }
        >
          <MenuItem
            icon={value.type === "number" ? <CheckIcon /> : <BlankIcon />}
            onClick={() => onChangeType("number")}
          >
            {l10n("FIELD_NUMBER")}
            <MenuAccelerator accelerator="n" />
          </MenuItem>
          <MenuItem
            icon={value.type === "variable" ? <CheckIcon /> : <BlankIcon />}
            onClick={() => onChangeType("variable")}
          >
            {l10n("FIELD_VARIABLE")}
            <MenuAccelerator accelerator="$" />
          </MenuItem>
          <MenuItem
            icon={value.type === "constant" ? <CheckIcon /> : <BlankIcon />}
            onClick={() => onChangeType("constant")}
          >
            {l10n("FIELD_CONSTANT")}
            <MenuAccelerator accelerator="c" />
          </MenuItem>
        </DropdownButton>
      </InputGroupPrepend>
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
      <VariableIndexBracket>]</VariableIndexBracket>
    </VariableIndexInputGroup>
  );
};
