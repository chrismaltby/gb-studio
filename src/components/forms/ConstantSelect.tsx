import React, { useState, FC, useMemo } from "react";
import {
  Select as DefaultSelect,
  Option,
  OptGroup,
  SelectCommonProps,
} from "ui/form/Select";
import styled from "styled-components";
import { constantSelectors } from "store/features/entities/entitiesState";
import { CheckIcon, PencilIcon } from "ui/icons/Icons";
import { IMEInput } from "ui/form/IMEInput";
import entitiesActions from "store/features/entities/entitiesActions";
import l10n from "shared/lib/lang/l10n";
import editorActions from "store/features/editor/editorActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { constantName } from "shared/lib/entities/entitiesHelpers";
import { StyledScriptEventBranchHeader } from "ui/scripting/style";

interface ConstantSelectProps extends SelectCommonProps {
  id?: string;
  name: string;
  value?: string;
  allowRename?: boolean;
  onChange: (newValue: string) => void;
}

const ConstantSelectWrapper = styled.div`
  position: relative;
  width: 100%;
  min-width: 78px;
`;

const Select: typeof DefaultSelect = styled(DefaultSelect)`
  .CustomSelect__control {
  }
`;

const ConstantRenameInput = styled(IMEInput)`
  &&&& {
    padding-right: 32px;
    height: 28px;
  }
  ${StyledScriptEventBranchHeader} &&&& {
    height: 22px;
  }
`;

const ConstantRenameButton = styled.button`
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

  ${ConstantSelectWrapper}:hover & {
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

  ${StyledScriptEventBranchHeader} &&&& {
    height: 16px;
  }
`;

const ConstantRenameCompleteButton = styled.button`
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

  ${StyledScriptEventBranchHeader} &&&& {
    height: 16px;
  }
`;

export const ConstantSelect: FC<ConstantSelectProps> = ({
  value,
  onChange,
  allowRename,
  ...selectProps
}) => {
  const [renameVisible, setRenameVisible] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [renameId, setRenameId] = useState("");
  const constants = useAppSelector((state) =>
    constantSelectors.selectAll(state),
  );
  const engineConstantsLookup = useAppSelector((state) => state.engine.consts);
  const currentConstant = useAppSelector((state) =>
    constantSelectors.selectById(state, value ?? ""),
  );

  const isEngineConstant = value?.startsWith("engine::");
  const engineConstantName = isEngineConstant
    ? value?.replace(/^engine::/, "")
    : "";

  const options = useMemo(() => {
    const userOptions: Option[] = constants.map(
      (constant, constantIndex): Option => ({
        value: constant.id,
        label: constantName(constant, constantIndex),
      }),
    );

    const engineOptions: Option[] = engineConstantsLookup
      ? Object.keys(engineConstantsLookup)
          .sort()
          .map(
            (name): Option => ({
              value: `engine::${name}`,
              label: name,
            }),
          )
      : [];

    const groupedOptions: OptGroup[] = [
      {
        // label: l10n("SIDEBAR_CONSTANTS"),
        label: "",
        options: userOptions,
      },
    ];

    if (engineOptions.length > 0) {
      groupedOptions.push({
        label: l10n("FIELD_ENGINE_CONSTANTS"),
        options: engineOptions,
      });
    }

    return groupedOptions;
  }, [constants, engineConstantsLookup]);

  const currentValue: Option | undefined = useMemo(() => {
    if (currentConstant) {
      return {
        value: currentConstant.id,
        label: constantName(
          currentConstant,
          constants.indexOf(currentConstant),
        ),
      };
    }
    if (isEngineConstant && engineConstantName) {
      return {
        value: value ?? "",
        label: engineConstantName,
      };
    }
    return undefined;
  }, [constants, currentConstant, isEngineConstant, engineConstantName, value]);

  const dispatch = useAppDispatch();

  const onRenameStart = () => {
    if (currentValue) {
      setEditValue(currentValue.label.replace(/^\$/, ""));
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
      dispatch(
        entitiesActions.renameConstant({
          constantId: renameId,
          name: editValue,
        }),
      );
    }
    setRenameVisible(false);
  };

  const onJumpToConstant = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (e.altKey && value) {
      dispatch(editorActions.selectConstant({ constantId: value }));
    }
  };

  return (
    <ConstantSelectWrapper onClick={onJumpToConstant}>
      {renameVisible ? (
        <ConstantRenameInput
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
          onChange={(newValue) => {
            if (newValue) {
              onChange(newValue.value);
            }
          }}
          {...selectProps}
        />
      )}
      {allowRename &&
        currentConstant &&
        !isEngineConstant &&
        (renameVisible ? (
          <ConstantRenameCompleteButton
            onClick={onRenameFinish}
            title={l10n("FIELD_RENAME")}
          >
            <CheckIcon />
          </ConstantRenameCompleteButton>
        ) : (
          <ConstantRenameButton
            onClick={onRenameStart}
            title={l10n("FIELD_RENAME")}
          >
            <PencilIcon />
          </ConstantRenameButton>
        ))}
    </ConstantSelectWrapper>
  );
};
