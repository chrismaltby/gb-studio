import React, { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import uniq from "lodash/uniq";
import {
  spriteSheetSelectors,
  spriteStateSelectors,
} from "store/features/entities/entitiesState";
import {
  Option as DefaultOption,
  CreatableSelect,
  Select as DefaultSelect,
  SelectCommonProps,
  OptGroup,
} from "ui/form/Select";
import l10n from "shared/lib/lang/l10n";
import styled from "styled-components";
import { CheckIcon, PencilIcon } from "ui/icons/Icons";
import { IMEInput } from "ui/form/IMEInput";
import { SingleValue } from "react-select";

type Option = DefaultOption & {
  title?: string;
};

interface AnimationStateSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  canRename?: boolean;
  allowDefault?: boolean;
  groupBySprites?: boolean;
  onChange?: (newId: string) => void;
}

const Wrapper = styled.div`
  position: relative;
  width: 100%;
`;

const StateRenameInput = styled(IMEInput)`
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

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const AnimationStateSelect = ({
  name,
  value,
  canRename,
  allowDefault,
  groupBySprites,
  onChange,
}: AnimationStateSelectProps) => {
  const [renameVisible, setRenameVisible] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [renameId, setRenameId] = useState("");
  const [currentValue, setCurrentValue] = useState<Option>();

  const [options, setOptions] = useState<(Option | OptGroup)[]>([]);
  const spriteStates = useAppSelector((state) =>
    spriteStateSelectors.selectAll(state),
  );
  const spriteStatesLookup = useAppSelector((state) =>
    spriteStateSelectors.selectEntities(state),
  );

  const sprites = useAppSelector((state) =>
    spriteSheetSelectors.selectAll(state),
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
    if (!groupBySprites) {
      // Flat list of sprite animation states
      setOptions(
        ([] as (Option | OptGroup)[]).concat(
          allowDefault
            ? {
                value: "",
                label: l10n("FIELD_DEFAULT"),
              }
            : [],
          uniq(
            spriteStates
              .map((s) => s.name)
              .filter((name): name is string => Boolean(name)),
          )
            .sort(collator.compare)
            .map((stateName) => ({
              value: stateName,
              label: stateName,
            })),
        ),
      );
      return;
    }

    // Group sprite animation states by the sprites that use them
    // If multiple sprites use the same state, it appears at the top of the list

    const stateSpritesLookup = sprites.reduce(
      (memo, sprite) => {
        for (const spriteStateId of sprite.states) {
          const spriteState = spriteStatesLookup[spriteStateId];
          if (spriteState && spriteState.name) {
            (memo[spriteState.name] ??= []).push(sprite.name);
          }
        }
        return memo;
      },
      {} as Record<string, string[]>,
    );

    const entries = Object.entries(stateSpritesLookup);

    const ungroupedOptions: Option[] = entries
      .filter(([, spriteNames]) => uniq(spriteNames).length > 1)
      .map(([stateName, spriteNames]) => {
        const uniqueSprites = uniq(spriteNames);
        return {
          value: stateName,
          label: stateName,
          title: uniqueSprites.join(", "),
        };
      })
      .sort((a, b) => collator.compare(a.label, b.label));

    const groupedOptions: OptGroup[] = Object.entries(
      entries
        .filter(([, spriteNames]) => uniq(spriteNames).length === 1)
        .reduce<Record<string, Option[]>>(
          (groups, [stateName, spriteNames]) => {
            const spriteName = spriteNames[0];
            (groups[spriteName] ??= []).push({
              value: stateName,
              label: stateName,
              title: spriteName,
            });
            return groups;
          },
          {},
        ),
    )
      .map(([label, options]) => ({
        label,
        options: options.sort((a, b) => collator.compare(a.label, b.label)),
      }))
      .sort((a, b) => collator.compare(a.label, b.label));

    setOptions(
      ([] as (Option | OptGroup)[]).concat(
        allowDefault
          ? {
              value: "",
              label: l10n("FIELD_DEFAULT"),
            }
          : [],
        ungroupedOptions,
        groupedOptions,
      ),
    );
  }, [allowDefault, groupBySprites, spriteStates, spriteStatesLookup, sprites]);

  useEffect(() => {
    setCurrentValue({
      value: value || "",
      label: value || (allowDefault ? l10n("FIELD_DEFAULT") : ""),
    });
  }, [allowDefault, value]);

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
      ) : canRename ? (
        <CreatableSelect
          name={name}
          value={currentValue}
          onChange={(e: SingleValue<Option>) => {
            if (e) {
              onChange?.(e.value);
            }
          }}
          options={options}
        />
      ) : (
        <DefaultSelect
          name={name}
          value={currentValue}
          onChange={(e: SingleValue<Option>) => {
            if (e) {
              onChange?.(e.value);
            }
          }}
          options={options}
          formatOptionLabel={(option: Option) => {
            return <div title={option.title}>{option.label}</div>;
          }}
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
