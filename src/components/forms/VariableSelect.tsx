import React, { useState, useEffect, FC } from "react";
import {
  Select as DefaultSelect,
  Option,
  OptGroup,
  SelectCommonProps,
} from "ui/form/Select";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  customEventSelectors,
  variableSelectors,
} from "store/features/entities/entitiesState";
import { RootState } from "store/configureStore";
import {
  groupVariables,
  NamedVariable,
  namedVariablesByContext,
  nextVariable,
} from "lib/helpers/variables";
import { CheckIcon, PencilIcon } from "ui/icons/Icons";
import { Input } from "ui/form/Input";
import entitiesActions from "store/features/entities/entitiesActions";
import l10n from "lib/helpers/l10n";
import { Dictionary } from "@reduxjs/toolkit";
import { keyBy } from "lodash";
import { EditorSelectionType } from "store/features/editor/editorState";
import editorActions from "store/features/editor/editorActions";

interface VariableSelectProps extends SelectCommonProps {
  id?: string;
  name: string;
  value?: string;
  type?: "8bit" | "16bit";
  entityId: string;
  allowRename?: boolean;
  onChange: (newValue: string) => void;
}

const Wrapper = styled.div`
  position: relative;
`;

const Select = styled(DefaultSelect)`
  .CustomSelect__control {
  }
`;

const OtherVariable = styled.span`
  opacity: 0.5;
`;

const VariableRenameInput = styled(Input)`
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

  ${Wrapper}:hover & {
    opacity: 1;
  }

  :focus {
    opacity: 1;
  }
  :hover {
    background: rgba(128, 128, 128, 0.3);
  }
  :active {
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

  :hover {
    background: rgba(128, 128, 128, 0.3);
  }
  :active {
    background: rgba(128, 128, 128, 0.4);
  }
  svg {
    width: 12px;
    height: 12px;
    fill: #333;
  }
`;

export const VariableToken = styled.span`
  background: ${(props) => props.theme.colors.token.variable};
  box-shadow: 0 0 0px 1px ${(props) => props.theme.colors.token.variable};
  border-radius: 5px;
  color: ${(props) => props.theme.colors.input.background};
`;

const formatOptionLabel =
  (
    type: "8bit" | "16bit",
    editorType: EditorSelectionType,
    namedVariablesLookup: Dictionary<NamedVariable>
  ) =>
  (option: Option) => {
    let otherVariable = "";
    if (type === "16bit") {
      if (editorType === "customEvent") {
        otherVariable = `${option.label}+1`;
      } else {
        otherVariable =
          namedVariablesLookup[nextVariable(option.value)]?.name || "";
      }
    }
    return (
      <>
        {option.label}
        {type === "16bit" && otherVariable && (
          <OtherVariable> & {otherVariable}</OtherVariable>
        )}
      </>
    );
  };

export const VariableSelect: FC<VariableSelectProps> = ({
  value,
  type = "8bit",
  onChange,
  entityId,
  allowRename,
  ...selectProps
}) => {
  const [renameVisible, setRenameVisible] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [renameId, setRenameId] = useState("");
  const [variables, setVariables] = useState<NamedVariable[]>([]);
  const [namedVariablesLookup, setNamedVariablesLookup] = useState<
    Dictionary<NamedVariable>
  >({});
  const [options, setOptions] = useState<OptGroup[]>([]);
  const [currentVariable, setCurrentVariable] = useState<NamedVariable>();
  const [currentValue, setCurrentValue] = useState<Option>();
  const editorType = useSelector((state: RootState) => state.editor.type);
  const variablesLookup = useSelector((state: RootState) =>
    variableSelectors.selectEntities(state)
  );
  const customEvent = useSelector((state: RootState) =>
    customEventSelectors.selectById(state, entityId)
  );
  const dispatch = useDispatch();

  const valueIsLocal = value && value.startsWith("L");
  const valueIsTemp = value && value.startsWith("T");
  const canRename = allowRename && !valueIsTemp && editorType !== "customEvent";

  useEffect(() => {
    const variables = namedVariablesByContext(
      editorType,
      entityId,
      variablesLookup,
      customEvent
    );
    const namedLookup = keyBy(variables, "id");
    setNamedVariablesLookup(namedLookup);
    const groupedVariables = groupVariables(variables);
    const groupedOptions: OptGroup[] = groupedVariables.map((g) => {
      const options = g.variables.map((v) => ({
        value: v.id,
        label: `${v.name}`,
      }));
      const filteredOptions =
        type === "16bit" && editorType !== "customEvent"
          ? options.filter((o) => {
              return namedLookup[nextVariable(o.value)];
            })
          : options;
      return {
        label: g.name,
        options: filteredOptions,
      };
    });
    setVariables(variables);
    setOptions(groupedOptions);
  }, [entityId, variablesLookup, editorType, customEvent, type]);

  useEffect(() => {
    setCurrentVariable(variables.find((v) => v.id === value));
  }, [variables, value]);

  useEffect(() => {
    if (currentVariable) {
      setCurrentValue({
        value: currentVariable.id,
        label: `${currentVariable.name}`,
      });
    }
  }, [currentVariable]);

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
          })
        );
      } else {
        dispatch(
          entitiesActions.renameVariable({
            variableId: renameId || "0",
            name: editValue,
          })
        );
      }
    }

    if (type === "16bit" && value === renameId) {
      // If editing 16-bit rename the second variable
      // once finished editing the first
      const next = namedVariablesLookup[nextVariable(value)];
      if (next) {
        setEditValue(next.name);
        setRenameId(next.id);
        setRenameVisible(true);
      } else {
        setRenameVisible(false);
      }
    } else {
      setRenameVisible(false);
    }
  };

  const onJumpToVariable = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (e.altKey) {
      if (
        value &&
        editorType !== "customEvent" &&
        Number.isInteger(Number(value))
      ) {
        dispatch(editorActions.selectVariable({ variableId: value }));
      }
    }
  };

  return (
    <Wrapper onClick={onJumpToVariable}>
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
          onChange={(newValue: Option) => {
            onChange(newValue.value);
          }}
          formatOptionLabel={formatOptionLabel(
            type,
            editorType,
            namedVariablesLookup
          )}
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
    </Wrapper>
  );
};
