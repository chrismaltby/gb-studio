import React, { FC, useState } from "react";
import styled from "styled-components";
import { Checkbox } from "./Checkbox";
import { Label } from "./Label";
import { CheckIcon, PencilIcon } from "ui/icons/Icons";
import l10n from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { Input } from "ui/form/Input";
import entitiesActions from "store/features/entities/entitiesActions";
import { variableSelectors } from "store/features/entities/entitiesState";

export interface FlagFieldFieldProps {
  readonly name: string;
  readonly bit: string;
  readonly variableId: string;
  readonly entityId: string;
  readonly defaultLabel?: string;
  readonly title?: string;
  readonly checked?: boolean;
  readonly onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Wrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 28px;

  ${Label} {
    margin-left: 5px;
    margin-bottom: 0px;
    margin-top: -1px;
  }
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
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  background: transparent; // ${(props) => props.theme.colors.input.background};
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

  z-index: 10001;

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

export const FlagField: FC<FlagFieldFieldProps> = ({
  name,
  variableId,
  bit,
  defaultLabel,
  title,
  checked,
  entityId,
  onChange,
}) => {
  const variableIsLocal = variableId && variableId.startsWith("L");
  const variableIsTemp = variableId && variableId.startsWith("T");
  const variableIsParam = variableId && variableId.startsWith("V");

  const namedVariable = useAppSelector((state) => {
    let id = variableId;
    if (variableIsLocal) {
      id = `${entityId}__${variableId}`;
    }
    return variableSelectors.selectById(state, id);
  });

  const canRename = namedVariable && !variableIsTemp && !variableIsParam;

  const label =
    (namedVariable?.flags && namedVariable?.flags[bit]) ?? defaultLabel;

  const [renameVisible, setRenameVisible] = useState(false);
  const [editValue, setEditValue] = useState(label);

  const dispatch = useAppDispatch();

  const onRenameStart = () => {
    setEditValue(label);
    setRenameVisible(true);
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
    const flags = namedVariable?.flags ?? {};
    const newFlags: Record<string, string> = { ...flags };

    if (editValue) {
      newFlags[bit] = editValue ?? "";
    } else {
      delete newFlags[bit];
    }

    if (variableIsLocal) {
      dispatch(
        entitiesActions.renameVariableFlag({
          variableId: `${entityId}__${variableId}`,
          flags: newFlags,
        })
      );
    } else {
      dispatch(
        entitiesActions.renameVariableFlag({
          variableId: variableId || "0",
          flags: newFlags,
        })
      );
    }
    setRenameVisible(false);
  };

  return (
    <Wrapper>
      {renameVisible ? (
        <VariableRenameInput
          key={variableId}
          value={editValue}
          onChange={onRename}
          onKeyDown={onRenameKeyDown}
          onFocus={onRenameFocus}
          onBlur={onRenameFinish}
          autoFocus
        />
      ) : (
        <>
          <Checkbox
            id={name}
            name={name}
            checked={checked}
            onChange={onChange}
          />
          {label && (
            <Label htmlFor={name} title={title}>
              {label}
            </Label>
          )}
        </>
      )}
      <>
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
      </>
    </Wrapper>
  );
};
