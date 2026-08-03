import React, { memo, useContext, useMemo, useState } from "react";
import {
  Select as DefaultSelect,
  Option,
  OptGroup,
  SelectCommonProps,
  findSelectOption,
} from "ui/form/Select";
import styled from "styled-components";
import {
  customEventSelectors,
  variableSelectors,
} from "store/features/entities/entitiesSelectors";
import {
  groupVariables,
  namedVariablesByContext,
} from "renderer/lib/variables";
import { CheckIcon, PencilIcon } from "ui/icons/Icons";
import { IMEInput } from "ui/form/IMEInput";
import entitiesActions from "store/features/entities/entitiesActions";
import l10n from "shared/lib/lang/l10n";
import editorActions from "store/features/editor/editorActions";
import { ScriptEditorContext } from "components/script/context/ScriptEditorContext";
import { UnitsSelectButtonInputOverlay } from "./UnitsSelectButtonInputOverlay";
import { UnitType } from "shared/lib/entities/entitiesTypes";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { SingleValue } from "react-select";

interface VariableSelectProps extends SelectCommonProps {
  id?: string;
  name: string;
  value?: string;
  entityId: string;
  allowRename?: boolean;
  onChange: (newValue: string) => void;
  units?: UnitType;
  unitsAllowed?: UnitType[];
  onChangeUnits?: (newUnits: UnitType) => void;
}

export const VariableSelectWrapper = styled.div`
  position: relative;
  width: 100%;
  min-width: 78px;
`;

const Select: typeof DefaultSelect = styled(DefaultSelect)`
  .CustomSelect__control {
  }
`;

const VariableRenameInput = styled(IMEInput)`
  &&&& {
    padding-right: 32px;
    height: 28px;
  }
`;

const VariableRenameButton = styled.button`
  position: absolute;
  top: 3px;
  right: 20px;
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: ${(props) => Math.max(0, props.theme.borderRadius - 1)}px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  line-height: 10px;
  font-size: 12px;
  font-weight: bold;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  background: ${(props) => props.theme.colors.input.background};
  border-color: ${(props) => props.theme.colors.input.background};

  ${VariableSelectWrapper}:hover & {
    opacity: 1;
  }

  &:focus {
    opacity: 1;
  }
  &:hover {
    background: rgba(128, 128, 128, 0.3);
  }
  &:active {
    background: rgba(128, 128, 128, 0.4);
  }

  svg {
    width: 12px;
    height: 12px;
    fill: #666;
  }
`;

const VariableRenameCompleteButton = styled.button`
  position: absolute;
  top: 3px;
  right: 3px;
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: ${(props) => Math.max(0, props.theme.borderRadius - 1)}px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  line-height: 10px;
  font-size: 12px;
  font-weight: bold;
  background: transparent;
  border-color: transparent;

  &:hover {
    background: rgba(128, 128, 128, 0.3);
  }
  &:active {
    background: rgba(128, 128, 128, 0.4);
  }
  svg {
    width: 12px;
    height: 12px;
    fill: #333;
  }
`;

const VariableSelectComponent = ({
  value,
  onChange,
  entityId,
  allowRename,
  units,
  unitsAllowed,
  onChangeUnits,
  ...selectProps
}: VariableSelectProps) => {
  const context = useContext(ScriptEditorContext);
  const [renameVisible, setRenameVisible] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [renameId, setRenameId] = useState("");
  const variablesLookup = useAppSelector((state) =>
    variableSelectors.selectEntities(state),
  );
  const customEvent = useAppSelector((state) =>
    customEventSelectors.selectById(state, entityId),
  );
  const dispatch = useAppDispatch();

  const valueIsLocal = value && value.startsWith("L");
  const valueIsTemp = value && value.startsWith("T");
  const canRename =
    allowRename && !valueIsTemp && context.entityType !== "customEvent";

  const options = useMemo<OptGroup[]>(() => {
    const variables = namedVariablesByContext(
      context,
      variablesLookup,
      customEvent,
    );
    const groupedVariables = groupVariables(variables);
    return groupedVariables.map((g) => {
      const options = g.variables.map((v) => ({
        value: v.id,
        label: `${v.name}`,
      }));
      return {
        label: g.name,
        options,
      };
    });
  }, [variablesLookup, context, customEvent]);

  const currentValue = useMemo(() => {
    return findSelectOption(options, value);
  }, [options, value]);

  const currentLabel = currentValue ? `$${currentValue.label}` : "";

  const onRenameStart = () => {
    if (currentValue) {
      setEditValue(currentValue.label);
      setRenameId(currentValue.value);
      setRenameVisible(true);
    }
  };

  const onRenameFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.select();
  };

  const onRename = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.currentTarget.value);
  };

  const onRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onRenameFinish();
    } else if (e.key === "Escape") {
      setRenameVisible(false);
    }
  };

  const onRenameFinish = () => {
    if (renameId) {
      if (valueIsLocal) {
        dispatch(
          entitiesActions.renameVariable({
            variableId: `${entityId}__${renameId}`,
            name: editValue,
          }),
        );
      } else {
        dispatch(
          entitiesActions.renameVariable({
            variableId: renameId || "0",
            name: editValue,
          }),
        );
      }
    }

    setRenameVisible(false);
  };

  const onJumpToVariable = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (e.altKey) {
      if (
        value &&
        context.entityType !== "customEvent" &&
        Number.isInteger(Number(value))
      ) {
        dispatch(editorActions.selectVariable({ variableId: value }));
      }
    }
  };

  return (
    <VariableSelectWrapper onClick={onJumpToVariable}>
      {renameVisible ? (
        <VariableRenameInput
          key={renameId}
          value={editValue}
          onChange={onRename}
          onKeyDown={onRenameKeyDown}
          onFocus={onRenameFocus}
          onBlur={onRenameFinish}
          autoFocus
        />
      ) : (
        <Select
          value={currentValue}
          options={options}
          onChange={(newValue: SingleValue<Option>) => {
            if (newValue) {
              onChange(newValue.value);
            }
          }}
          formatOptionLabel={(option, { context }) =>
            context === "value" ? `$${option.label}` : option.label
          }
          {...selectProps}
        />
      )}
      {canRename &&
        (renameVisible ? (
          <VariableRenameCompleteButton
            onClick={onRenameFinish}
            title={l10n("FIELD_RENAME")}
          >
            <CheckIcon />
          </VariableRenameCompleteButton>
        ) : (
          <VariableRenameButton
            onClick={onRenameStart}
            title={l10n("FIELD_RENAME")}
          >
            <PencilIcon />
          </VariableRenameButton>
        ))}
      {units && (
        <UnitsSelectButtonInputOverlay
          parentValue={currentLabel}
          value={units}
          allowedValues={unitsAllowed}
          onChange={onChangeUnits}
        />
      )}
    </VariableSelectWrapper>
  );
};

export const VariableSelect = memo<VariableSelectProps>(
  VariableSelectComponent,
);
