import React, { useState, useEffect, FC } from "react";
import {
  Select as DefaultSelect,
  Option,
  OptGroup,
  components,
} from "../ui/form/Select";
import styled from "styled-components";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import {
  customEventSelectors,
  variableSelectors,
} from "../../store/features/entities/entitiesState";
import { RootState } from "../../store/configureStore";
import {
  groupVariables,
  NamedVariable,
  namedVariablesByContext,
  nextVariable,
} from "../../lib/helpers/variables";
import { RelativePortal } from "../ui/layout/RelativePortal";
import { Tooltip } from "../ui/tooltips/Tooltip";
import {
  Bits16Icon,
  Bits8Icon,
  CheckIcon,
  PencilIcon,
} from "../ui/icons/Icons";
import useDelayedState from "../ui/hooks/use-delayed-state";
import { Input } from "../ui/form/Input";
import entitiesActions from "../../store/features/entities/entitiesActions";
import l10n from "../../lib/helpers/l10n";
import { Dictionary } from "@reduxjs/toolkit";
import { keyBy } from "lodash";

interface VariableSelectProps {
  id?: string;
  value?: string;
  type: "8bit" | "16bit";
  entityId: string;
  allowRename?: boolean;
  onChange: (newValue: string) => void;
}

const Wrapper = styled.div`
  position: relative;
`;

const Select = styled(DefaultSelect)`
  .CustomSelect__control {
    padding-left: 22px;
  }
`;

const OtherVariable = styled.span`
  opacity: 0.5;
`;

const VariableSizeIndicator = styled.div`
  position: absolute;
  top: 1px;
  left: 1px;
  width: 24px;
  height: 26px;
  background-color: ${(props) => props.theme.colors.input.border};
  border-top-left-radius: 3px;
  border-bottom-left-radius: 3px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  line-height: 10px;
  font-size: 12px;
  font-weight: bold;
  opacity: 0.8;

  :hover {
    opacity: 1;
  }

  svg {
    width: 20px;
    height: 20px;
    fill: ${(props) => props.theme.colors.input.text};
  }
`;

const VariableRenameInput = styled(Input)`
  &&&& {
    padding-left: 25px;
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
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  line-height: 10px;
  font-size: 12px;
  font-weight: bold;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  background: transparent;
  border-color: transparent;

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
  border-radius: 3px;
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

export const VariableSelect: FC<VariableSelectProps> = ({
  value,
  type = "8bit",
  onChange,
  entityId,
  allowRename,
}) => {
  const [tooltipVisible, setTooltipVisible] = useDelayedState(false);
  const [renameVisible, setRenameVisible] = useState(false);
  const [editValue, setEditValue] = useState("");
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
  const canRename = allowRename && !valueIsTemp;

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
        type === "16bit"
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
  }, [entityId, variablesLookup, editorType, customEvent]);

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

  const onClickType = () => {
    setTooltipVisible(true);
  };

  const onMouseEnterType = () => {
    setTooltipVisible(true, 500);
  };

  const onMouseLeaveType = () => {
    setTooltipVisible(false);
  };

  const onRenameStart = () => {
    if (currentValue) {
      setEditValue(currentValue.label);
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
    }
  };

  const onRenameFinish = () => {
    setRenameVisible(false);
    if (value) {
      if (valueIsLocal) {
        dispatch(
          entitiesActions.renameVariable({
            variableId: `${entityId}__${value}`,
            name: editValue,
          })
        );
      } else {
        dispatch(
          entitiesActions.renameVariable({
            variableId: value || "0",
            name: editValue,
          })
        );
      }
    }
  };

  return (
    <Wrapper>
      {tooltipVisible && (
        <RelativePortal pin="top-right" offsetX={80} offsetY={33}>
          {type === "8bit" && (
            <Tooltip style={{ width: 120 }}>
              8-bit number with a maximum value of 255
            </Tooltip>
          )}
          {type === "16bit" && (
            <Tooltip style={{ width: 200 }}>
              16-bit number with a maximum value of 65535.
              <br />
              Value is calculated using two 8-bit variables:
              {currentValue && (
                <>
                  <br />
                  (${currentValue.label} * 256) + $
                  {namedVariablesLookup[nextVariable(currentValue.value)]?.name}
                </>
              )}
            </Tooltip>
          )}
        </RelativePortal>
      )}

      {renameVisible ? (
        <VariableRenameInput
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
          getOptionLabel={(option: Option, a: any, b: any) => {
            return (
              <>
                {option.label}
                {type === "16bit" && (
                  <OtherVariable>
                    {" "}
                    & {namedVariablesLookup[nextVariable(option.value)]?.name}
                  </OtherVariable>
                )}
              </>
            );
          }}
        />
      )}
      <VariableSizeIndicator
        onClick={onClickType}
        onMouseEnter={onMouseEnterType}
        onMouseLeave={onMouseLeaveType}
      >
        {type === "8bit" && <Bits8Icon />}
        {type === "16bit" && <Bits16Icon />}
      </VariableSizeIndicator>
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
