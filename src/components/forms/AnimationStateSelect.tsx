import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import uniq from "lodash/uniq";
import { RootState } from "store/configureStore";
import { spriteStateSelectors } from "store/features/entities/entitiesState";
import {
  Option,
  CreatableSelect,
  Select as DefaultSelect,
  SelectCommonProps,
} from "ui/form/Select";
import { Input } from "ui/form/Input";
import l10n from "lib/helpers/l10n";
import styled from "styled-components";
import { CheckIcon, PencilIcon } from "ui/icons/Icons";

interface AnimationStateSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  canRename?: boolean;
  allowDefault?: boolean;
  onChange?: (newId: string) => void;
}

const Wrapper = styled.div`
  position: relative;
`;

const StateRenameInput = styled(Input)`
  &&&& {
    padding-right: 32px;
    height: 28px;
  }
`;

const StateRenameButton = styled.button`
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

const StateRenameCompleteButton = styled.button`
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

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const AnimationStateSelect = ({
  name,
  value,
  canRename,
  allowDefault,
  onChange,
}: AnimationStateSelectProps) => {
  const [renameVisible, setRenameVisible] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [renameId, setRenameId] = useState("");
  const [currentValue, setCurrentValue] = useState<Option>();

  const [options, setOptions] = useState<Option[]>([]);
  const spriteStates = useSelector((state: RootState) =>
    spriteStateSelectors.selectAll(state)
  );

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
      onChange?.(editValue);
    }
    setRenameVisible(false);
  };

  useEffect(() => {
    const options = ([] as Option[]).concat(
      allowDefault
        ? {
            value: "",
            label: l10n("FIELD_DEFAULT"),
          }
        : [],
      uniq(
        spriteStates
          .map((state) => state.name)
          .filter((i) => i)
          .sort(collator.compare)
      ).map((state) => ({
        value: state,
        label: state,
      }))
    );

    setOptions(options);
  }, [allowDefault, spriteStates]);

  useEffect(() => {
    setCurrentValue({
      value: value || "",
      label: value || (allowDefault ? l10n("FIELD_DEFAULT") : ""),
    });
  }, [allowDefault, value]);

  const Select = canRename ? CreatableSelect : DefaultSelect;

  return (
    <Wrapper>
      {renameVisible ? (
        <StateRenameInput
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
          name={name}
          value={currentValue}
          onChange={(e: Option) => {
            onChange?.(e.value);
          }}
          options={options}
        />
      )}
      {canRename &&
        (renameVisible ? (
          <StateRenameCompleteButton
            onClick={onRenameFinish}
            title={l10n("FIELD_RENAME")}
          >
            <CheckIcon />
          </StateRenameCompleteButton>
        ) : (
          <StateRenameButton
            onClick={onRenameStart}
            title={l10n("FIELD_RENAME")}
          >
            <PencilIcon />
          </StateRenameButton>
        ))}
    </Wrapper>
  );
};

export default AnimationStateSelect;
