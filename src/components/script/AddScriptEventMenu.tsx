import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import cloneDeep from "lodash/cloneDeep";
import { OptGroup } from "ui/form/Select";
import l10n, { L10NKey } from "shared/lib/lang/l10n";
import styled, { css } from "styled-components";
import { Menu, MenuGroup, MenuItem, MenuItemCaret } from "ui/menu/Menu";
import { CaretRightIcon, StarIcon } from "ui/icons/Icons";
import { FlexGrow } from "ui/spacing/Spacing";
import { Button } from "ui/buttons/Button";
import Fuse from "fuse.js";
import settingsActions from "store/features/settings/settingsActions";
import {
  ScriptEventNormalized,
  ScriptEventFieldSchema,
  ScriptEventParentType,
  CustomEventNormalized,
} from "shared/lib/entities/entitiesTypes";
import entitiesActions from "store/features/entities/entitiesActions";
import {
  customEventSelectors,
  emoteSelectors,
  musicSelectors,
  sceneSelectors,
  spriteSheetSelectors,
  tilesetSelectors,
} from "store/features/entities/entitiesState";
import { useDebounce } from "ui/hooks/use-debounce";
import { ScriptEditorContext } from "./ScriptEditorContext";
import { defaultVariableForContext } from "shared/lib/scripts/context";
import { EVENT_CALL_CUSTOM_EVENT, EVENT_COMMENT, EVENT_TEXT } from "consts";
import { selectScriptEventDefsWithPresets } from "store/features/scriptEventDefs/scriptEventDefsState";
import type { ScriptEventDef } from "lib/project/loadScriptEventHandlers";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { mapScriptValueLeafNodes } from "shared/lib/scriptValue/helpers";
import { isScriptValue } from "shared/lib/scriptValue/types";
import { HighlightWords } from "ui/util/HighlightWords";
import { IMEUnstyledInput } from "ui/form/IMEInput";
import { StyledButton } from "ui/buttons/style";
import { StyledMenu, StyledMenuItem } from "ui/menu/style";
import { ScriptEventDefs } from "shared/lib/scripts/scriptDefHelpers";

interface AddScriptEventMenuProps {
  parentType: ScriptEventParentType;
  parentId: string;
  parentKey: string;
  insertId?: string | undefined;
  before?: boolean | undefined;
  onBlur?: () => void;
}

type MenuElement = HTMLDivElement & {
  scrollIntoViewIfNeeded: (center: boolean) => void;
};

interface EventOption {
  label: string;
  displayLabel?: string; // non searchable label, used only to display in the menu
  description?: string; // override tooltip
  value: string;
  group?: string;
  groupLabel?: string;
  subGroup?: string;
  subGroupLabel?: string;
  isFavorite: boolean;
  defaultArgs?: Record<string, unknown>;
  event: ScriptEventDef;
}

interface EventOptGroup {
  label: string;
  displayLabel?: string; // non searchable label, used only to display in the menu
  groupLabel?: string;
  options: EventOption[];
}

interface InstanciateOptions {
  defaultSceneId: string;
  defaultVariableId: string;
  defaultMusicId: string;
  defaultActorId: string;
  defaultSpriteId: string;
  defaultEmoteId: string;
  defaultTilesetId: string;
  defaultEngineFieldId: string;
  defaultArgs?: Record<string, unknown>;
}

const MENU_HEADER_HEIGHT = 68;
const MENU_ITEM_HEIGHT = 25;
const MENU_GROUP_HEIGHT = 25;
const MENU_GROUP_SPACER = 10;

const instanciateScriptEvent = (
  handler: ScriptEventDef,
  {
    defaultSceneId,
    defaultVariableId,
    defaultMusicId,
    defaultActorId,
    defaultSpriteId,
    defaultEmoteId,
    defaultTilesetId,
    defaultEngineFieldId,
    defaultArgs,
  }: InstanciateOptions,
): Omit<ScriptEventNormalized, "id"> => {
  const [command, presetId] = handler.id.split("::");

  const flattenFields = (
    fields: ScriptEventFieldSchema[],
    memo: ScriptEventFieldSchema[] = [],
  ) => {
    const addFields = (fields: ScriptEventFieldSchema[]) => {
      for (const field of fields) {
        memo.push(field);
        if (field.type === "group" && field.fields) {
          addFields(field.fields);
        }
      }
    };
    addFields(fields);
    return memo;
  };

  const fields = flattenFields(handler.fields || []);

  const preset = presetId
    ? handler.presets?.find((p) => p.id === presetId)
    : undefined;

  const args = cloneDeep(
    fields.reduce(
      (memo, field) => {
        if (!field.key) {
          return memo;
        }
        let replaceValue = null;
        let defaultValue = field.defaultValue;

        // Pull value from preset if available
        if (preset && preset.values[field.key ?? ""]) {
          defaultValue = preset.values[field.key ?? ""];
          replaceValue = defaultValue;
        }

        if (field.type === "union") {
          defaultValue = (field?.defaultValue as Record<string, unknown>)?.[
            field.defaultType || ""
          ];
        }
        if (defaultValue === "LAST_SCENE") {
          replaceValue = defaultSceneId;
        } else if (defaultValue === "LAST_VARIABLE") {
          replaceValue = defaultVariableId;
        } else if (defaultValue === "LAST_MUSIC") {
          replaceValue = defaultMusicId;
        } else if (defaultValue === "LAST_SPRITE") {
          replaceValue = defaultSpriteId;
        } else if (defaultValue === "LAST_EMOTE") {
          replaceValue = defaultEmoteId;
        } else if (defaultValue === "LAST_TILESET") {
          replaceValue = defaultTilesetId;
        } else if (defaultValue === "LAST_ACTOR") {
          replaceValue = defaultActorId;
        } else if (defaultValue === "LAST_ENGINE_FIELD") {
          replaceValue = defaultEngineFieldId;
        } else if (field.type === "events") {
          return memo;
        } else if (defaultValue !== undefined) {
          replaceValue = defaultValue;
        }

        if (field.type === "value") {
          replaceValue = isScriptValue(defaultValue)
            ? mapScriptValueLeafNodes(defaultValue, (node) => {
                if (
                  node.type === "variable" &&
                  node.value === "LAST_VARIABLE"
                ) {
                  return {
                    ...node,
                    value: defaultVariableId,
                  };
                } else if (
                  node.type === "engineField" &&
                  node.value === "LAST_ENGINE_FIELD"
                ) {
                  return {
                    ...node,
                    value: defaultEngineFieldId,
                  };
                }
                return node;
              })
            : defaultValue;
        }

        if (field.type === "union") {
          replaceValue = {
            type: field.defaultType,
            value: replaceValue,
          };
        }
        if (replaceValue !== null) {
          const key = field.key ?? "";
          return {
            ...memo,
            [key]: memo[key] ?? replaceValue,
          };
        }

        return memo;
      },
      { ...defaultArgs } as Record<string, unknown>,
    ),
  );
  const childFields = fields.filter((field) => field.type === "events");
  const children =
    childFields.length > 0
      ? childFields.reduce(
          (memo, field) => {
            const key = field.key ?? "";
            return {
              ...memo,
              [key]: [],
            };
          },
          {} as Record<string, string[]>,
        )
      : undefined;
  return {
    command,
    args,
    ...(children && { children }),
  };
};

const eventToOption =
  (favorites: string[], group?: string) =>
  (event: ScriptEventDef): EventOption => {
    const localisedKey = l10n(event.id as L10NKey); //.replace(/[^:*]*:[ ]*/g, "");
    const name =
      localisedKey !== event.id ? localisedKey : event.name || event.id;
    const groupName = group
      ? l10n(group as L10NKey)
      : l10n(event.groups?.[0] as L10NKey);
    const subGroup =
      group && event.subGroups?.[group]
        ? l10n(event.subGroups?.[group] as L10NKey)
        : undefined;
    return {
      label: name,
      group: groupName,
      value: event.id,
      event,
      isFavorite: favorites.includes(event.id),
      subGroup,
    };
  };

const customEventToOption =
  (scriptEventDefs: ScriptEventDefs) =>
  (event: CustomEventNormalized): EventOption => {
    return {
      label: event.name,
      displayLabel: `${l10n(EVENT_CALL_CUSTOM_EVENT)} "${event.name}"`,
      description: event.description.trim(),
      value: `call_script_${event.id}`,
      isFavorite: false,
      event: scriptEventDefs[EVENT_CALL_CUSTOM_EVENT] as ScriptEventDef,
      defaultArgs: {
        customEventId: event.id,
      },
    } as EventOption;
  };

const titleForOption = (
  option: EventOption | EventOptGroup,
): string | undefined => {
  // If option description is provided with a non-empty
  // string then use that as the title for menu item
  if (
    "description" in option &&
    option.description &&
    option.description.length > 0
  ) {
    return option.description;
  }
  // Otherwise use event description if available
  if ("event" in option) {
    return option.event.description;
  }
  return undefined;
};

const SelectMenu = styled.div`
  width: 300px;

  ${StyledMenu} {
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

const SelectMenuInput = styled(IMEUnstyledInput)`
  background: ${(props) => props.theme.colors.input.background};
  color: ${(props) => props.theme.colors.input.text};
  border: 1px solid ${(props) => props.theme.colors.input.border};
  font-size: ${(props) => props.theme.typography.fontSize};
  border-radius: ${(props) => props.theme.borderRadius}px;
  padding: 5px;
  box-sizing: border-box;
  width: 100%;
  height: 28px;
  &:focus {
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
  $isOpen: boolean;
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
    transition:
      transform 0.2s linear,
      opacity 0.2s linear;
  }
  ${SelectMenuTitle}:nth-child(2) {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    opacity: 0;
    transform: translateX(80px);
    transition:
      transform 0.2s linear,
      opacity 0.2s linear;
  }
  ${SelectMenuBackButton} {
    transition: opacity 0.2s linear;
    opacity: 0;
  }

  ${(props) =>
    props.$isOpen
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
  $isOpen: boolean;
}

const SelectMenuOptionsWrapper = styled.div<SelectMenuOptionsWrapperProps>`
  width: 200%;
  display: flex;
  flex-grow: 1;
  height: 0px;
  flex-grow: 1;
  transition: transform 0.2s ease-in-out;
  ${(props) =>
    props.$isOpen
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

interface MenuItemFavoriteProps {
  $visible: boolean;
  $isFavorite: boolean;
}

const MenuItemFavorite = styled.div<MenuItemFavoriteProps>`
  opacity: 0;
  svg {
    display: inline-block;
    width: 10px;
    height: 10px;
    fill: ${(props) => props.theme.colors.text};
  }

  ${StyledButton} {
    height: 18px;
    padding: 0;
    margin: -10px -5px;
    transition: all 0.1s ease-out;
  }

  ${(props) =>
    props.$visible
      ? css`
          opacity: 1;
        `
      : ""}
  ${(props) =>
    !props.$isFavorite
      ? css`
          svg {
            opacity: 0.3;
          }

          ${StyledButton}:active {
            transform: scale(1.5);
            svg {
              opacity: 1;
            }
          }
        `
      : ""}      
  ${StyledMenuItem}:hover > & {
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

const sortAlphabeticallyByLabel = (
  a: { label: string },
  b: { label: string },
) => {
  if (a.label === b.label) {
    return 0;
  } else if (a.label === l10n("EVENT_GROUP_MISC")) {
    return 1;
  } else if (b.label === l10n("EVENT_GROUP_MISC")) {
    return -1;
  }
  return a.label < b.label ? -1 : 1;
};

const sortAlphabeticallyBySubGroupThenLabel = (
  a: { subGroup?: string; label: string },
  b: { subGroup?: string; label: string },
) => {
  const aSubGroup = a.subGroup ?? "";
  const bSubGroup = b.subGroup ?? "";

  if (aSubGroup === bSubGroup) {
    return a.label.localeCompare(b.label);
  }
  return aSubGroup.localeCompare(bSubGroup);
};

const notDeprecated = (a: { deprecated?: boolean }) => {
  return !a.deprecated;
};

const identity = <T,>(i: T): T => i;

const AddScriptEventMenu = ({
  parentId,
  parentKey,
  parentType,
  insertId,
  before,
  onBlur,
}: AddScriptEventMenuProps) => {
  const dispatch = useAppDispatch();
  const firstLoad = useRef(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [options, setOptions] = useState<(EventOptGroup | EventOption)[]>([]);
  const [allOptions, setAllOptions] = useState<(EventOptGroup | EventOption)[]>(
    [],
  );
  const favoriteEvents = useAppSelector(
    (state) => state.project.present.settings.favoriteEvents,
  );
  const [favoritesCache, setFavoritesCache] = useState<string[]>([]);
  const scriptEventPresets = useAppSelector(
    (state) => state.project.present.settings.scriptEventPresets,
  );
  const scriptEventDefaultPresets = useAppSelector(
    (state) => state.project.present.settings.scriptEventDefaultPresets,
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(-1);
  const [renderCategoryIndex, setRenderedCategoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootOptionsRef = useRef<HTMLDivElement>(null);
  const childOptionsRef = useRef<HTMLDivElement>(null);
  const fuseRef = useRef<Fuse<EventOption> | null>(null);

  const lastSceneId = useAppSelector((state) => {
    const ids = sceneSelectors.selectIds(state);
    return ids[ids.length - 1];
  });
  const lastMusicId = useAppSelector(
    (state) => musicSelectors.selectIds(state)[0],
  );
  const lastSpriteId = useAppSelector(
    (state) => spriteSheetSelectors.selectIds(state)[0],
  );
  const lastEmoteId = useAppSelector(
    (state) => emoteSelectors.selectIds(state)[0],
  );
  const lastTilesetId = useAppSelector(
    (state) => tilesetSelectors.selectIds(state)[0],
  );
  const lastEngineFieldId = useAppSelector(
    (state) => state.engine.defaultEngineFieldId,
  );
  const context = useContext(ScriptEditorContext);
  const scriptEventDefs = useAppSelector((state) =>
    selectScriptEventDefsWithPresets(state),
  );
  const customEventsLookup = useAppSelector((state) =>
    customEventSelectors.selectAll(state),
  );

  useEffect(() => {
    if (selectedCategoryIndex === -1) {
      setFavoritesCache(favoriteEvents);
    }
  }, [favoriteEvents, selectedCategoryIndex]);

  useEffect(() => {
    const eventList = (
      Object.values(scriptEventDefs).filter(identity) as ScriptEventDef[]
    ).filter(notDeprecated);

    const allEvents = ([] as EventOption[]).concat(
      eventList.map(eventToOption(favoriteEvents)),
      customEventsLookup.map(customEventToOption(scriptEventDefs)),
    );

    fuseRef.current = new Fuse(allEvents, {
      includeScore: true,
      includeMatches: true,
      ignoreLocation: true,
      threshold: 0.8,
      keys: [
        "label",
        {
          name: "group",
          weight: 2,
        },
      ],
    });

    const groupedEvents = eventList.reduce(
      (memo, event) => {
        if (Array.isArray(event.groups)) {
          event.groups.forEach((group) => {
            if (!memo[group]) {
              memo[group] = [event];
            } else {
              memo[group]?.push(event);
            }
          });
        } else {
          const group = "EVENT_GROUP_MISC";
          if (!memo[group]) {
            memo[group] = [event];
          } else {
            memo[group]?.push(event);
          }
        }
        return memo;
      },
      {} as Record<string, ScriptEventDef[]>,
    );

    const groupKeys = Object.keys(groupedEvents).sort(sortAlphabetically);

    const allOptions = ([] as (EventOptGroup | EventOption)[]).concat(
      (
        (firstLoad.current ? favoritesCache : favoriteEvents)
          .map((id: string) => scriptEventDefs[id])
          .filter(identity) as ScriptEventDef[]
      )
        .map(eventToOption(favoriteEvents))
        .sort(sortAlphabeticallyByLabel)
        .map((option, optionIndex) => {
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
          label: key === "" ? l10n("EVENT_GROUP_MISC") : l10n(key as L10NKey),
          options: (groupedEvents[key] || [])
            .map(eventToOption(favoriteEvents, key))
            .sort(sortAlphabeticallyBySubGroupThenLabel)
            .map((item, index, array) => {
              if (index === 0 || item.subGroup !== array[index - 1].subGroup) {
                return { ...item, subGroupLabel: item.subGroup };
              }
              return item;
            }),
        }))
        .sort(sortAlphabeticallyByLabel)
        .map((option, optionIndex) => {
          if (optionIndex === 0) {
            return {
              ...option,
              groupLabel: l10n("FIELD_CATEGORIES"),
            };
          }
          return option;
        }),
    );
    setAllOptions(allOptions);
    if (!firstLoad.current) {
      setOptions(allOptions);
      firstLoad.current = true;
    }
  }, [customEventsLookup, favoriteEvents, favoritesCache, scriptEventDefs]);

  const updateOptions = useCallback(() => {
    if (searchTerm && fuseRef.current) {
      const queryWords = searchTerm.toUpperCase().split(" ");
      const searchOptions = fuseRef.current
        .search(searchTerm)
        .map((res) => res.item)
        .filter((item) => {
          // Make sure matches include search terms
          return queryWords.reduce((memo: boolean, word: string) => {
            const groupIndex = item.group?.toUpperCase()?.indexOf(word) ?? -1;
            const labelIndex = item.label?.toUpperCase()?.indexOf(word) ?? -1;
            return memo && (labelIndex > -1 || groupIndex > -1);
          }, true);
        });
      setOptions(
        searchOptions.length > 0
          ? searchOptions
          : [
              {
                value: "fallback_option_0",
                label: `${l10n(EVENT_TEXT)} "${searchTerm}"`,
                event: scriptEventDefs[EVENT_TEXT] as ScriptEventDef,
                defaultArgs: {
                  text: [searchTerm],
                },
                isFavorite: false,
              },
              {
                value: "fallback_option_1",
                label: `${l10n(EVENT_COMMENT)} "${searchTerm}"`,
                event: scriptEventDefs[EVENT_COMMENT] as ScriptEventDef,
                defaultArgs: {
                  text: [searchTerm],
                },
                isFavorite: false,
              },
            ],
      );
      setSelectedIndex(0);
      setSelectedCategoryIndex(-1);
    } else {
      setOptions(allOptions);
    }
  }, [allOptions, scriptEventDefs, searchTerm]);

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
          `[data-index="${index}"]`,
        ) as MenuElement;
        if (el) {
          el.focus();
          el.scrollIntoViewIfNeeded(false);
        }
      } else if (rootOptionsRef.current && selectedCategoryIndex === -1) {
        const el = rootOptionsRef.current.querySelector(
          `[data-index="${index}"]`,
        ) as MenuElement;
        if (el) {
          el.focus();
          el.scrollIntoViewIfNeeded(false);
        }
      }
    },
    [selectedCategoryIndex],
  );

  const onAdd = useCallback(
    (newEvent: ScriptEventDef, defaultArgs?: Record<string, unknown>) => {
      const defaultPresetId = scriptEventDefaultPresets[newEvent.id];
      const userDefaults =
        scriptEventPresets[newEvent.id]?.[defaultPresetId]?.args;
      dispatch(
        entitiesActions.addScriptEvents({
          entityId: parentId,
          type: parentType,
          key: parentKey,
          insertId,
          before,
          data: [
            instanciateScriptEvent(newEvent, {
              defaultActorId: "player",
              defaultVariableId: defaultVariableForContext(context.type),
              defaultMusicId: String(lastMusicId),
              defaultSceneId: String(lastSceneId),
              defaultSpriteId: String(lastSpriteId),
              defaultEmoteId: String(lastEmoteId),
              defaultTilesetId: String(lastTilesetId),
              defaultEngineFieldId: String(lastEngineFieldId),
              defaultArgs: {
                ...defaultArgs,
                ...userDefaults,
                __presetId: defaultPresetId,
                text: defaultArgs?.text ?? userDefaults?.text,
              },
            }),
          ],
        }),
      );
      onBlur?.();
    },
    [
      scriptEventDefaultPresets,
      scriptEventPresets,
      dispatch,
      parentId,
      parentType,
      parentKey,
      insertId,
      before,
      context.type,
      lastMusicId,
      lastSceneId,
      lastSpriteId,
      lastEmoteId,
      lastTilesetId,
      lastEngineFieldId,
      onBlur,
    ],
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
        if ("event" in option) {
          onAdd(option.event, option.defaultArgs);
        }
      } else {
        const categoryOption = options[selectedCategoryIndex];
        if ("options" in categoryOption) {
          const option = categoryOption.options[index];
          if ("event" in option) {
            onAdd(option.event, option.defaultArgs);
          }
        }
      }
    },
    [onAdd, options, selectedCategoryIndex],
  );

  const onToggleFavouriteEventId = useCallback(
    (eventId: string) => {
      dispatch(settingsActions.toggleFavoriteEvent(eventId));
    },
    [dispatch],
  );

  const onToggleFavoriteOption = useCallback(
    (index: number) => {
      if (selectedCategoryIndex === -1) {
        const option = options[index];
        if ("event" in option) {
          onToggleFavouriteEventId(option.event.id);
          inputRef.current?.focus();
        }
      } else {
        const categoryOption = options[selectedCategoryIndex];
        if ("options" in categoryOption) {
          const option = categoryOption.options[index];
          if ("event" in option) {
            onToggleFavouriteEventId(option.event.id);
            inputRef.current?.focus();
          }
        }
      }
    },
    [onToggleFavouriteEventId, options, selectedCategoryIndex],
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
      } else if (e.key === "Tab") {
        e.preventDefault();
        onToggleFavoriteOption(selectedIndex);
      }
    },
    [
      onBlur,
      onSelectOption,
      onToggleFavoriteOption,
      options,
      scrollIntoViewIfNeeded,
      searchTerm.length,
      selectedCategoryIndex,
      selectedIndex,
    ],
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
    [],
  );

  const highlightWords = useMemo(
    () => searchTerm.split(" ").filter((i) => i),
    [searchTerm],
  );

  const menuHeight =
    MENU_HEADER_HEIGHT +
    allOptions.length * MENU_ITEM_HEIGHT +
    MENU_GROUP_HEIGHT +
    (favoriteEvents.length > 0 ? MENU_GROUP_HEIGHT + MENU_GROUP_SPACER : 0);

  if (allOptions.length === 0) {
    return null;
  }

  return (
    <SelectMenu>
      <Menu style={{ height: menuHeight }}>
        <SelectMenuHeader
          $isOpen={!searchTerm && selectedCategoryIndex > -1}
          onClick={() => onSelectOption(-1)}
        >
          <SelectMenuTitle>{l10n("SIDEBAR_ADD_EVENT")}</SelectMenuTitle>
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
          $isOpen={!searchTerm && selectedCategoryIndex > -1}
        >
          <SelectMenuOptions ref={rootOptionsRef}>
            {options.map((option, optionIndex) => (
              <React.Fragment
                key={"value" in option ? option.value : option.label}
              >
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
                  title={titleForOption(option)}
                >
                  {searchTerm.length > 0 && highlightWords.length > 0 ? (
                    <HighlightWords
                      text={option.displayLabel ?? option.label}
                      words={highlightWords}
                    />
                  ) : (
                    (option.displayLabel ?? option.label)
                  )}

                  {"options" in option ? (
                    <MenuItemCaret />
                  ) : (
                    <>
                      <FlexGrow />
                      {!option.defaultArgs && (
                        <MenuItemFavorite
                          $visible={
                            (selectedCategoryIndex === -1 &&
                              selectedIndex === optionIndex) ||
                            selectedCategoryIndex === optionIndex ||
                            ("isFavorite" in option && option.isFavorite)
                          }
                          $isFavorite={option.isFavorite}
                        >
                          <Button
                            size="small"
                            variant="transparent"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onToggleFavoriteOption(optionIndex);
                            }}
                          >
                            <StarIcon />
                          </Button>
                        </MenuItemFavorite>
                      )}
                    </>
                  )}
                </MenuItem>
              </React.Fragment>
            ))}
          </SelectMenuOptions>
          <SelectMenuOptions ref={childOptionsRef}>
            {renderCategoryIndex > -1 &&
              (options[renderCategoryIndex] as EventOptGroup)?.options &&
              (options[renderCategoryIndex] as EventOptGroup).options.map(
                (childOption, childOptionIndex) => (
                  <React.Fragment key={childOption.value}>
                    {childOption.subGroupLabel && (
                      <MenuGroup key={childOption.subGroupLabel}>
                        {childOption.subGroupLabel}
                      </MenuGroup>
                    )}
                    <MenuItem
                      key={childOption.value}
                      data-index={childOptionIndex}
                      selected={selectedIndex === childOptionIndex}
                      onMouseOver={() => setSelectedIndex(childOptionIndex)}
                      onClick={() => onSelectOption(childOptionIndex)}
                      title={titleForOption(childOption)}
                    >
                      {childOption.displayLabel ?? childOption.label}
                      <FlexGrow />
                      <MenuItemFavorite
                        $visible={
                          selectedIndex === childOptionIndex ||
                          childOption.isFavorite
                        }
                        $isFavorite={childOption.isFavorite}
                      >
                        <Button
                          size="small"
                          variant="transparent"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggleFavoriteOption(childOptionIndex);
                          }}
                        >
                          <StarIcon />
                        </Button>
                      </MenuItemFavorite>
                    </MenuItem>
                  </React.Fragment>
                ),
              )}
          </SelectMenuOptions>
        </SelectMenuOptionsWrapper>
      </Menu>
    </SelectMenu>
  );
};

export default AddScriptEventMenu;
