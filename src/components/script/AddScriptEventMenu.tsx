import React, { useCallback, useEffect, useRef, useState } from "react";
import { OptGroup } from "ui/form/Select";
import events, { EventHandler } from "lib/events";
import l10n from "lib/helpers/l10n";
import styled, { css } from "styled-components";
import { Menu, MenuGroup, MenuItem } from "ui/menu/Menu";
import { CaretRightIcon, StarIcon, StarOutlineIcon } from "ui/icons/Icons";
import { FlexGrow } from "ui/spacing/Spacing";
import { Button } from "ui/buttons/Button";
import Fuse from "fuse.js";
import groupBy from "lodash/groupBy";

interface AddScriptEventMenuProps {
  onChange?: (addValue: EventHandler) => void;
  onBlur?: () => void;
}

interface EventOption {
  label: string;
  value: string;
  groupLabel?: string;
  event: EventHandler;
}

interface EventOptGroup {
  label: string;
  groupLabel?: string;
  options: EventOption[];
}

const eventToOption = (event: EventHandler): EventOption => {
  const localisedKey = l10n(event.id);
  const name =
    localisedKey !== event.id ? localisedKey : event.name || event.id;
  return {
    label: name,
    value: event.id,
    event,
  };
};

const defaultFavourites = [
  events["EVENT_TEXT"],
  events["EVENT_SWITCH_SCENE"],
] as EventHandler[];

const SelectMenu = styled.div`
  padding: 10px;
  width: 300px;
  height: 450px;

  ${Menu} {
    width: 300px;
    height: 450px;
    overflow: hidden;
  }
`;

const SelectMenuSearchWrapper = styled.div`
  display: flex;
  padding: 5px;
  box-sizing: border-box;
`;

const SelectMenuInput = styled.input`
  background: ${(props) => props.theme.colors.input.background};
  color: ${(props) => props.theme.colors.input.text};
  border: 1px solid ${(props) => props.theme.colors.input.border};
  font-size: ${(props) => props.theme.typography.fontSize};
  border-radius: ${(props) => props.theme.borderRadius}px;
  padding: 5px;
  box-sizing: border-box;
  width: 100%;
  height: 28px;
  :focus {
    border: 2px solid ${(props) => props.theme.colors.highlight};
    background: ${(props) => props.theme.colors.input.activeBackground};
    box-shadow: none;
  }
`;

const SelectMenuTitle = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 30px;
`;

const SelectMenuBackButton = styled.button`
  opacity: 0;
  border: 0px;
  height: 100%;
  background: transparent;
  svg {
    width: 10px;
    height: 10px;
    transform: scaleX(-1);
    fill: ${(props) => props.theme.colors.button.text};
  }
`;

interface SelectMenuHeaderProps {
  isOpen: boolean;
}

const SelectMenuHeader = styled.div<SelectMenuHeaderProps>`
  position: relative;
  height: 30px;
  flex-shrink: 0;
  display: flex;
  align-items: center;

  ${SelectMenuTitle}:nth-child(1) {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    transition: transform 0.2s linear, opacity 0.2s linear;
  }
  ${SelectMenuTitle}:nth-child(2) {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    opacity: 0;
    transform: translateX(80px);
    transition: transform 0.2s linear, opacity 0.2s linear;
  }
  ${SelectMenuBackButton} {
    transition: opacity 0.2s linear;
    opacity: 0;
  }

  ${(props) =>
    props.isOpen
      ? css`
          ${SelectMenuTitle}:nth-child(1) {
            transform: translateX(-80px);
            opacity: 0;
          }
          ${SelectMenuTitle}:nth-child(2) {
            transform: translateX(0px);
            opacity: 1;
          }
          ${SelectMenuBackButton} {
            opacity: 1;
          }
        `
      : ""}
`;

interface SelectMenuOptionsWrapperProps {
  isOpen: boolean;
}

const SelectMenuOptionsWrapper = styled.div<SelectMenuOptionsWrapperProps>`
  width: 200%;
  display: flex;
  flex-grow: 1;
  height: 0px;
  flex-grow: 1;
  transition: transform 0.2s ease-in-out;
  ${(props) =>
    props.isOpen
      ? css`
          transform: translateX(-50%);
        `
      : ""}
`;

const SelectMenuOptions = styled.div`
  width: 50%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  flex-shrink: 0;
`;

const MenuItemCaret = styled.div`
  flex-grow: 1;
  text-align: right;
  svg {
    display: inline-block;
    width: 10px;
    height: 10px;
    fill: ${(props) => props.theme.colors.text};
  }
`;

const MenuItemFavorite = styled.div`
  opacity: 0;
  svg {
    display: inline-block;
    width: 10px;
    height: 10px;
    fill: ${(props) => props.theme.colors.text};
  }
  ${Button} {
    height: 18px;
    padding: 0;
    margin: -10px -5px;
  }
  ${MenuItem}:hover > & {
    opacity: 1;
  }
`;

const sortAlphabetically = (a: string, b: string) => {
  if (a === b) {
    return 0;
  } else if (a === "EVENT_GROUP_MISC") {
    return 1;
  } else if (b === "EVENT_GROUP_MISC") {
    return -1;
  }
  return a < b ? -1 : 1;
};

const AddScriptEventMenu = ({ onChange, onBlur }: AddScriptEventMenuProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [options, setOptions] = useState<(EventOptGroup | EventOption)[]>([]);
  const [allOptions, setAllOptions] = useState<(EventOptGroup | EventOption)[]>(
    []
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(-1);
  const [renderCategoryIndex, setRenderedCategoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const childOptionsRef = useRef<HTMLDivElement>(null);
  const fuseRef = useRef<Fuse<EventOption> | null>(null);

  useEffect(() => {
    const eventList = Object.values(events).filter((i) => i) as EventHandler[];
    fuseRef.current = new Fuse(eventList.map(eventToOption), {
      includeScore: true,
      includeMatches: true,
      ignoreLocation: true,
      threshold: 0.2,
      keys: ["label"],
    });

    const groupedEvents = groupBy(
      eventList,
      (e) => e.group || "EVENT_GROUP_MISC"
    );
    console.log(groupedEvents);

    const groupKeys = Object.keys(groupedEvents).sort(sortAlphabetically);
    console.log(groupKeys);

    const allOptions = ([] as (EventOptGroup | EventOption)[]).concat(
      defaultFavourites.map(eventToOption).map((option, optionIndex) => {
        if (optionIndex === 0) {
          return {
            ...option,
            groupLabel: l10n("FIELD_FAVORITES"),
          };
        }
        return option;
      }),
      groupKeys
        .map((key: string) => ({
          label: key === "" ? l10n("EVENT_GROUP_MISC") : l10n(key),
          options: groupedEvents[key].map(eventToOption),
        }))
        .map((option, optionIndex) => {
          if (optionIndex === 0) {
            return {
              ...option,
              groupLabel: l10n("FIELD_CATEGORIES"),
            };
          }
          return option;
        })
    );
    setAllOptions(allOptions);
  }, []);

  useEffect(() => {
    if (searchTerm && fuseRef.current) {
      console.log(fuseRef.current.search(searchTerm));
      setOptions(fuseRef.current.search(searchTerm).map((res) => res.item));
      setSelectedIndex(0);
      setSelectedCategoryIndex(-1);
    } else {
      setOptions(allOptions);
    }
  }, [allOptions, searchTerm]);

  const scrollIntoViewIfNeeded = useCallback(
    (index: number) => {
      if (childOptionsRef.current && selectedCategoryIndex > -1) {
        const el = childOptionsRef.current.querySelector(
          `[data-index="${index}"]`
        );
        if (el) {
          (el as any).focus();
          (el as any).scrollIntoViewIfNeeded(false);
        }
      }
    },
    [selectedCategoryIndex]
  );

  const onSelectCategory = useCallback(
    (index: number) => {
      if (
        index === -1 ||
        (selectedCategoryIndex === -1 && "options" in options[index])
      ) {
        setSelectedCategoryIndex(index);
        setRenderedCategoryIndex(index);
        setSelectedIndex(0);
        inputRef.current?.focus();
      } else if (selectedCategoryIndex === -1) {
        const option = options[index];
        if ("event" in option) {
          onChange?.(option.event);
        }
      } else {
        const categoryOption = options[selectedCategoryIndex];
        if ("options" in categoryOption) {
          const option = categoryOption.options[index];
          if ("event" in option) {
            onChange?.(option.event);
          }
        }
      }
    },
    [onChange, options, selectedCategoryIndex]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        if (searchTerm.length > 0) {
          setSelectedIndex(0);
          setSelectedCategoryIndex(-1);
          setSearchTerm("");
        } else if (selectedCategoryIndex === -1) {
          onBlur?.();
        } else {
          setSelectedIndex(selectedCategoryIndex);
          setSelectedCategoryIndex(-1);
        }
      } else if (e.key === "ArrowDown") {
        const max =
          selectedCategoryIndex === -1
            ? options.length - 1
            : (options[selectedCategoryIndex] as OptGroup)?.options?.length - 1;
        setSelectedIndex(Math.min(selectedIndex + 1, max));
        scrollIntoViewIfNeeded(Math.min(selectedIndex + 1, max));
      } else if (e.key === "ArrowUp") {
        setSelectedIndex(Math.max(selectedIndex - 1, 0));
        scrollIntoViewIfNeeded(selectedIndex - 1);
      } else if (e.key === "Enter") {
        onSelectCategory(selectedIndex);
      }
    },
    [
      onBlur,
      onSelectCategory,
      options,
      scrollIntoViewIfNeeded,
      searchTerm.length,
      selectedCategoryIndex,
      selectedIndex,
    ]
  );

  const onChangeSearchTerm = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.currentTarget.value);
    },
    []
  );

  return (
    <SelectMenu>
      <Menu>
        <SelectMenuHeader
          isOpen={!searchTerm && selectedCategoryIndex > -1}
          onClick={() => onSelectCategory(-1)}
        >
          <SelectMenuTitle>Add Event</SelectMenuTitle>
          <SelectMenuTitle>
            {renderCategoryIndex > -1 && options[renderCategoryIndex]?.label}
          </SelectMenuTitle>

          <SelectMenuBackButton>
            <CaretRightIcon />
          </SelectMenuBackButton>
        </SelectMenuHeader>
        <SelectMenuSearchWrapper>
          <SelectMenuInput
            ref={inputRef}
            autoFocus
            value={searchTerm}
            placeholder={l10n("TOOLBAR_SEARCH")}
            onKeyDown={onKeyDown}
            onChange={onChangeSearchTerm}
          />
        </SelectMenuSearchWrapper>
        <SelectMenuOptionsWrapper
          isOpen={!searchTerm && selectedCategoryIndex > -1}
        >
          <SelectMenuOptions>
            {options.map((option, optionIndex) => (
              <>
                {option.groupLabel && (
                  <MenuGroup key={option.groupLabel}>
                    {option.groupLabel}
                  </MenuGroup>
                )}
                <MenuItem
                  key={option.label}
                  selected={
                    (selectedCategoryIndex === -1 &&
                      selectedIndex === optionIndex) ||
                    selectedCategoryIndex === optionIndex
                  }
                  onMouseOver={() => setSelectedIndex(optionIndex)}
                  onClick={() => onSelectCategory(optionIndex)}
                >
                  {option.label}
                  {"options" in option ? (
                    <MenuItemCaret>
                      <CaretRightIcon />
                    </MenuItemCaret>
                  ) : (
                    <>
                      <FlexGrow />
                      <MenuItemFavorite>
                        <Button size="small" variant="transparent">
                          <StarIcon />
                        </Button>
                      </MenuItemFavorite>
                    </>
                  )}
                </MenuItem>
              </>
            ))}
          </SelectMenuOptions>
          <SelectMenuOptions ref={childOptionsRef}>
            {renderCategoryIndex > -1 &&
              (options[renderCategoryIndex] as OptGroup)?.options &&
              (options[renderCategoryIndex] as OptGroup).options.map(
                (childOption, childOptionIndex) => (
                  <MenuItem
                    key={childOption.value}
                    data-index={childOptionIndex}
                    selected={selectedIndex === childOptionIndex}
                    onMouseOver={() => setSelectedIndex(childOptionIndex)}
                    onClick={() => onSelectCategory(childOptionIndex)}
                  >
                    {childOption.label}
                    <FlexGrow />
                    <MenuItemFavorite>
                      <Button size="small" variant="transparent">
                        <StarOutlineIcon />
                      </Button>
                    </MenuItemFavorite>
                  </MenuItem>
                )
              )}
          </SelectMenuOptions>
        </SelectMenuOptionsWrapper>
      </Menu>
    </SelectMenu>
  );
};

export default AddScriptEventMenu;
