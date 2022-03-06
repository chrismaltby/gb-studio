import React, {
  CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { OptGroup } from "ui/form/Select";
import l10n from "lib/helpers/l10n";
import styled, { css } from "styled-components";
import { Menu, MenuGroup, MenuItem } from "ui/menu/Menu";
import { CaretRightIcon } from "ui/icons/Icons";
import { FlexGrow } from "ui/spacing/Spacing";
import { useSelector } from "react-redux";
import { RootState } from "store/configureStore";
import { useDebounce } from "ui/hooks/use-debounce";
import {
  backgroundSelectors,
  customEventSelectors,
  emoteSelectors,
  fontSelectors,
  musicSelectors,
  sceneSelectors,
  soundSelectors,
  spriteSheetSelectors,
  variableSelectors,
} from "store/features/entities/entitiesState";
import {
  Background,
  CustomEvent,
  Emote,
  Font,
  Music,
  Scene,
  Sound,
  SpriteSheet,
  Variable,
} from "store/features/entities/entitiesTypes";
import { Reference, ReferenceType } from "./ReferencesSelect";
import {
  customEventName,
  sceneName,
} from "store/features/entities/entitiesHelpers";
import { FixedSizeList as List } from "react-window";
import { allVariables, globalVariableDefaultName } from "lib/helpers/variables";

interface AddReferenceMenuProps {
  onBlur?: () => void;
  onAdd: (newRef: Reference) => void;
}

type MenuElement = HTMLDivElement & {
  scrollIntoViewIfNeeded: (center: boolean) => void;
};

interface EventOption {
  label: string;
  value: string;
  referenceType: ReferenceType;
  group?: string;
  groupLabel?: string;
}

interface EventOptGroup {
  label: string;
  groupLabel?: string;
  options: EventOption[];
}

const MENU_HEADER_HEIGHT = 68;
const MENU_ITEM_HEIGHT = 25;
const MENU_GROUP_HEIGHT = 25;

const backgroundToOption = (background: Background): EventOption => {
  return {
    label: background.name,
    value: background.id,
    referenceType: "background",
  };
};

const spriteToOption = (sprite: SpriteSheet): EventOption => {
  return {
    label: sprite.name,
    value: sprite.id,
    referenceType: "sprite",
  };
};

const fontToOption = (font: Font): EventOption => {
  return {
    label: font.name,
    value: font.id,
    referenceType: "font",
  };
};

const sceneToOption = (scene: Scene, index: number): EventOption => {
  return {
    label: sceneName(scene, index),
    value: scene.id,
    referenceType: "scene",
  };
};

const variableToOption = (variable: {
  id: string;
  namedVariable?: Variable;
}): EventOption => {
  return {
    label: variable.namedVariable
      ? variable.namedVariable.name
      : globalVariableDefaultName(variable.id),
    value: variable.id,
    referenceType: "variable",
  };
};

const musicToOption = (music: Music): EventOption => {
  return {
    label: music.name,
    value: music.id,
    referenceType: "music",
  };
};

const soundToOption = (sound: Sound): EventOption => {
  return {
    label: sound.name,
    value: sound.id,
    referenceType: "sound",
  };
};

const emoteToOption = (emote: Emote): EventOption => {
  return {
    label: emote.name,
    value: emote.id,
    referenceType: "emote",
  };
};

const customEventToOption = (
  customEvent: CustomEvent,
  index: number
): EventOption => {
  return {
    label: customEventName(customEvent, index),
    value: customEvent.id,
    referenceType: "script",
  };
};

const SelectMenu = styled.div`
  width: 300px;

  ${Menu} {
    width: 100%;
    height: 450px;
    min-height: 300px;
    max-height: min(80vh, 700px);
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

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const sortAlphabeticallyByLabel = (
  a: { label: string },
  b: { label: string }
) => {
  if (a.label === b.label) {
    return 0;
  } else if (a.label === l10n("EVENT_GROUP_MISC")) {
    return 1;
  } else if (b.label === l10n("EVENT_GROUP_MISC")) {
    return -1;
  }
  return collator.compare(a.label, b.label);
};

const AddReferenceMenu = ({ onBlur, onAdd }: AddReferenceMenuProps) => {
  const firstLoad = useRef(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [options, setOptions] = useState<(EventOptGroup | EventOption)[]>([]);
  const [allOptions, setAllOptions] = useState<(EventOptGroup | EventOption)[]>(
    []
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(-1);
  const [renderCategoryIndex, setRenderedCategoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootOptionsRef = useRef<HTMLDivElement>(null);
  const childOptionsRef = useRef<HTMLDivElement>(null);
  const childOptionsListRef = useRef<List>(null);

  const backgrounds = useSelector((state: RootState) =>
    backgroundSelectors.selectAll(state)
  );
  const sprites = useSelector((state: RootState) =>
    spriteSheetSelectors.selectAll(state)
  );
  const customEvents = useSelector((state: RootState) =>
    customEventSelectors.selectAll(state)
  );
  const variablesLookup = useSelector((state: RootState) =>
    variableSelectors.selectEntities(state)
  );
  const emotes = useSelector((state: RootState) =>
    emoteSelectors.selectAll(state)
  );
  const fonts = useSelector((state: RootState) =>
    fontSelectors.selectAll(state)
  );
  const scenes = useSelector((state: RootState) =>
    sceneSelectors.selectAll(state)
  );
  const tracks = useSelector((state: RootState) =>
    musicSelectors.selectAll(state)
  );
  const sounds = useSelector((state: RootState) =>
    soundSelectors.selectAll(state)
  );
  const musicDriver = useSelector(
    (state: RootState) => state.project.present.settings.musicDriver
  );

  useEffect(() => {
    const allOptions = ([] as (EventOptGroup | EventOption)[]).concat([
      {
        label: l10n("FIELD_BACKGROUNDS"),
        options: backgrounds
          .map(backgroundToOption)
          .sort(sortAlphabeticallyByLabel),
      },
      {
        label: l10n("FIELD_EMOTES"),
        options: emotes.map(emoteToOption).sort(sortAlphabeticallyByLabel),
      },

      {
        label: l10n("FIELD_FONTS"),
        options: fonts.map(fontToOption).sort(sortAlphabeticallyByLabel),
      },
      {
        label: l10n("FIELD_SONGS"),
        options: tracks
          .filter(
            (track) =>
              (musicDriver === "huge" && track.type === "uge") ||
              (musicDriver !== "huge" && track.type !== "uge")
          )
          .map(musicToOption)
          .sort(sortAlphabeticallyByLabel),
      },
      {
        label: l10n("MENU_SFX"),
        options: sounds.map(soundToOption).sort(sortAlphabeticallyByLabel),
      },
      {
        label: l10n("FIELD_SCENES"),
        options: scenes.map(sceneToOption).sort(sortAlphabeticallyByLabel),
      },
      {
        label: l10n("FIELD_SCRIPTS"),
        options: customEvents
          .map(customEventToOption)
          .sort(sortAlphabeticallyByLabel),
      },
      {
        label: l10n("FIELD_SPRITES"),
        options: sprites.map(spriteToOption).sort(sortAlphabeticallyByLabel),
      },
      {
        label: l10n("FIELD_VARIABLES"),
        options: allVariables
          .map((id: string) => ({
            id,
            namedVariable: variablesLookup[id],
          }))
          .map(variableToOption)
          .sort(sortAlphabeticallyByLabel),
      },
    ]);
    setAllOptions(allOptions);
    if (!firstLoad.current) {
      setOptions(allOptions);
      firstLoad.current = true;
    }
  }, [
    backgrounds,
    tracks,
    variablesLookup,
    musicDriver,
    sprites,
    emotes,
    fonts,
    scenes,
    customEvents,
    sounds,
  ]);

  const updateOptions = useCallback(() => {
    if (searchTerm) {
      const query = searchTerm.toUpperCase();
      const searchOptions = allOptions.flatMap((option) => {
        if ("options" in option) {
          return option.options.filter((opt) => {
            return opt.label.toUpperCase().indexOf(query) > -1;
          });
        }
        return [];
      });
      setOptions(searchOptions);
      setSelectedIndex(0);
      setSelectedCategoryIndex(-1);
    } else {
      setOptions(allOptions);
    }
  }, [allOptions, searchTerm]);

  const debouncedUpdateOptions = useDebounce(updateOptions, 200);

  useEffect(debouncedUpdateOptions, [
    debouncedUpdateOptions,
    allOptions,
    searchTerm,
  ]);

  const scrollIntoViewIfNeeded = useCallback(
    (index: number) => {
      if (childOptionsRef.current && selectedCategoryIndex > -1) {
        const el = childOptionsRef.current.querySelector(
          `[data-index="${index}"]`
        ) as MenuElement;
        if (el) {
          el.focus();
          el.scrollIntoViewIfNeeded(false);
        }
      } else if (rootOptionsRef.current && selectedCategoryIndex === -1) {
        const el = rootOptionsRef.current.querySelector(
          `[data-index="${index}"]`
        ) as MenuElement;
        if (el) {
          el.focus();
          el.scrollIntoViewIfNeeded(false);
        }
      }
    },
    [selectedCategoryIndex]
  );

  const onSelectOption = useCallback(
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
        if ("referenceType" in option) {
          onAdd({
            type: option.referenceType,
            id: option.value,
          });
          onBlur?.();
        }
      } else {
        const categoryOption = options[selectedCategoryIndex];
        if ("options" in categoryOption) {
          const option = categoryOption.options[index];
          if ("referenceType" in option) {
            onAdd({
              type: option.referenceType,
              id: option.value,
            });
            onBlur?.();
          }
        }
      }
    },
    [onAdd, onBlur, options, selectedCategoryIndex]
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
        e.preventDefault();
        const max =
          selectedCategoryIndex === -1
            ? options.length - 1
            : (options[selectedCategoryIndex] as OptGroup)?.options?.length - 1;
        setSelectedIndex(Math.min(selectedIndex + 1, max));
        scrollIntoViewIfNeeded(Math.min(selectedIndex + 1, max));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(Math.max(selectedIndex - 1, 0));
        scrollIntoViewIfNeeded(selectedIndex - 1);
      } else if (e.key === "Enter") {
        onSelectOption(selectedIndex);
      }
    },
    [
      onBlur,
      onSelectOption,
      options,
      scrollIntoViewIfNeeded,
      searchTerm.length,
      selectedCategoryIndex,
      selectedIndex,
    ]
  );

  const onChangeSearchTerm = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.currentTarget.value;
      if (value.trim() === "") {
        setSearchTerm("");
      } else {
        setSearchTerm(e.currentTarget.value);
      }
    },
    []
  );

  const menuHeight = MENU_HEADER_HEIGHT + allOptions.length * MENU_ITEM_HEIGHT;

  if (allOptions.length === 0) {
    return null;
  }

  return (
    <SelectMenu>
      <Menu style={{ height: menuHeight, minHeight: menuHeight }}>
        <SelectMenuHeader
          isOpen={!searchTerm && selectedCategoryIndex > -1}
          onClick={() => onSelectOption(-1)}
        >
          <SelectMenuTitle>{l10n("FIELD_ADD_REFERENCE")}</SelectMenuTitle>
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
          <SelectMenuOptions ref={rootOptionsRef}>
            {options.map((option, optionIndex) => (
              <>
                {option.groupLabel && (
                  <MenuGroup key={option.groupLabel}>
                    {option.groupLabel}
                  </MenuGroup>
                )}
                <MenuItem
                  key={option.label}
                  data-index={optionIndex}
                  selected={
                    (selectedCategoryIndex === -1 &&
                      selectedIndex === optionIndex) ||
                    selectedCategoryIndex === optionIndex
                  }
                  onMouseOver={() => setSelectedIndex(optionIndex)}
                  onClick={() => onSelectOption(optionIndex)}
                >
                  {option.label}
                  {"options" in option ? (
                    <MenuItemCaret>
                      <CaretRightIcon />
                    </MenuItemCaret>
                  ) : (
                    <>
                      <FlexGrow />
                    </>
                  )}
                </MenuItem>
              </>
            ))}
          </SelectMenuOptions>
          <SelectMenuOptions ref={childOptionsRef}>
            {renderCategoryIndex > -1 &&
              (options[renderCategoryIndex] as EventOptGroup)?.options && (
                <List
                  ref={childOptionsListRef}
                  width="100%"
                  height={allOptions.length * MENU_ITEM_HEIGHT}
                  itemCount={
                    (options[renderCategoryIndex] as EventOptGroup)?.options
                      .length
                  }
                  itemSize={MENU_ITEM_HEIGHT}
                  itemData={{
                    items: (options[renderCategoryIndex] as EventOptGroup)
                      ?.options,
                    selectedIndex,
                    setSelectedIndex,
                    onSelectOption,
                  }}
                >
                  {Row}
                </List>
              )}
          </SelectMenuOptions>
        </SelectMenuOptionsWrapper>
      </Menu>
    </SelectMenu>
  );
};

interface VirtualRowProps {
  readonly index: number;
  readonly style: CSSProperties;
  readonly data: {
    readonly items: EventOption[];
    readonly selectedIndex: number;
    readonly setSelectedIndex: (index: number) => void;
    readonly onSelectOption: (index: number) => void;
  };
}

const Row = ({ index, data, style }: VirtualRowProps) => {
  const item = data.items[index];
  if (!item) {
    return <div style={style} />;
  }
  return (
    <div style={style}>
      <MenuItem
        key={item.value}
        data-index={index}
        selected={data.selectedIndex === index}
        onMouseOver={() => data.setSelectedIndex(index)}
        onClick={() => data.onSelectOption(index)}
      >
        {item.label}
      </MenuItem>
    </div>
  );
};

export default AddReferenceMenu;
