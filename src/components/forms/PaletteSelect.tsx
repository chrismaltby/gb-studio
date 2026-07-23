import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import styled from "styled-components";
import {
  getLocalisedDMGPalette,
  getLocalisedPalettesLookup,
} from "store/features/entities/entitiesSelectors";
import PaletteBlock, { PaletteBlockType } from "components/forms/PaletteBlock";
import {
  Option,
  CreatableSelect,
  OptionLabelWithPreview,
  SingleValueWithPreview,
  SelectCommonProps,
  FormatFolderLabel,
  OptionLabelHoverContent,
} from "ui/form/Select";
import l10n from "shared/lib/lang/l10n";
import { InputActionMeta, SelectInstance, SingleValue } from "react-select";
import { Palette } from "shared/lib/resources/types";
import { PencilIcon } from "ui/icons/Icons";
import CustomPalettePicker from "./CustomPalettePicker";
import { MenuOverlay } from "ui/menu/Menu";
import { RelativePortal } from "ui/layout/RelativePortal";
import entitiesActions from "store/features/entities/entitiesActions";

interface PaletteSelectProps extends SelectCommonProps {
  name: string;
  prefix?: string;
  value?: string;
  type?: PaletteBlockType;
  onChange?: (newId: string) => void;
  onCreate?: (newId: string) => void;
  optional?: boolean;
  optionalLabel?: string;
  optionalDefaultPaletteId?: string;
  canKeep?: boolean;
  canRestore?: boolean;
  keepLabel?: string;
  canAuto?: boolean;
  autoPalette?: Palette;
}

interface PaletteOption extends Option {
  palette?: Palette;
}

const PaletteSelectPrefix = styled.div`
  min-width: 13px;
  padding-right: 2px;
  font-weight: bold;
`;

const EDITOR_PANEL_WIDTH = 286;
const EDITOR_PANEL_GAP = 10;
const EDITOR_PORTAL_Z_INDEX = 1001;

interface EditingPaletteState {
  id: string;
  offsetX: number;
}

const getEditorOffsetX = (menu: Element | null | undefined) => {
  const menuAnchor =
    menu?.closest(".CustomSelect__menu-portal") ||
    menu?.closest(".CustomSelect");
  const menuRect = menu?.getBoundingClientRect();
  const menuAnchorRect = menuAnchor?.getBoundingClientRect();

  return menuRect && menuAnchorRect
    ? menuRect.left -
        menuAnchorRect.left -
        EDITOR_PANEL_WIDTH -
        EDITOR_PANEL_GAP
    : -(EDITOR_PANEL_WIDTH + EDITOR_PANEL_GAP);
};

const PaletteEditorPanel = styled.div`
  position: fixed;
  z-index: 1001;
  width: ${EDITOR_PANEL_WIDTH}px;
  box-sizing: border-box;
  color: ${(props) => props.theme.colors.text};
  background: ${(props) => props.theme.colors.menu.background};
  border-radius: ${(props) => props.theme.borderRadius}px;
  box-shadow: ${(props) => props.theme.colors.menu.boxShadow};
`;

const EditPaletteButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin: -3px -5px -3px 5px;
  padding: 3px;
  color: ${(props) => props.theme.colors.text};
  background: transparent;
  border: 0;
  border-radius: ${(props) => props.theme.borderRadius}px;

  &:hover {
    background: ${(props) => props.theme.colors.menu.activeBackground};
  }

  svg {
    width: 13px;
    height: 13px;
    fill: currentColor;
  }
`;

const PaletteOptionLabel = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PaletteSelectComponent = ({
  name,
  value,
  prefix,
  type,
  onChange,
  onCreate,
  optional,
  optionalLabel,
  optionalDefaultPaletteId,
  canKeep,
  canRestore,
  canAuto,
  autoPalette,
  keepLabel,
  onBlur,
  ...selectProps
}: PaletteSelectProps) => {
  const dispatch = useAppDispatch();
  const palettesLookup = useAppSelector((state) =>
    getLocalisedPalettesLookup(state),
  );
  const palettes = useMemo(
    () => Object.values(palettesLookup),
    [palettesLookup],
  );
  const dmgPalette = useMemo(getLocalisedDMGPalette, []);
  const selectRef = useRef<SelectInstance<PaletteOption>>(null);
  const paletteEditorPanelRef = useRef<HTMLDivElement>(null);
  const editingPaletteRef = useRef(false);
  const [editingPalette, setEditingPalette] =
    useState<EditingPaletteState | null>(null);
  const [createdPaletteId, setCreatedPaletteId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");

  const closeEditor = useCallback(() => {
    const activeElement = document.activeElement;
    if (
      activeElement instanceof HTMLElement &&
      paletteEditorPanelRef.current?.contains(activeElement)
    ) {
      activeElement.blur();
    }
    editingPaletteRef.current = false;
    setEditingPalette(null);
    selectRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!editingPalette) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeEditor();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeEditor, editingPalette]);

  const onEditPalette = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, paletteId: string) => {
      event.preventDefault();
      event.stopPropagation();

      editingPaletteRef.current = true;
      setEditingPalette({
        id: paletteId,
        offsetX: getEditorOffsetX(
          event.currentTarget.closest(".CustomSelect__menu"),
        ),
      });
    },
    [],
  );

  const onSearchInputChange = useCallback(
    (newValue: string, actionMeta: InputActionMeta) => {
      if (
        editingPaletteRef.current &&
        (actionMeta.action === "input-blur" ||
          actionMeta.action === "menu-close")
      ) {
        return;
      }
      setSearchValue(newValue);
    },
    [],
  );

  const options = useMemo(
    () =>
      ([] as PaletteOption[]).concat(
        canKeep
          ? ([
              {
                value: "keep",
                label: keepLabel || "Keep",
              },
            ] as PaletteOption[])
          : [],
        canRestore
          ? ([
              {
                value: "restore",
                label: l10n("FIELD_RESTORE_DEFAULT"),
              },
            ] as PaletteOption[])
          : [],
        canAuto
          ? ([
              {
                value: "auto",
                label: l10n("FIELD_AUTOMATIC"),
                palette: autoPalette,
              },
            ] as PaletteOption[])
          : [],
        optional
          ? ([
              {
                value: "",
                label: optionalLabel || "None",
                palette: optionalDefaultPaletteId
                  ? palettesLookup[optionalDefaultPaletteId] || dmgPalette
                  : dmgPalette,
              },
            ] as PaletteOption[])
          : ([] as PaletteOption[]),
        {
          value: dmgPalette.id,
          label: dmgPalette.name,
          palette: dmgPalette,
        },
        palettes.map((palette) => ({
          value: palette.id,
          label: palette.name,
          palette,
        })),
      ),
    [
      palettes,
      palettesLookup,
      canKeep,
      canRestore,
      keepLabel,
      optional,
      optionalDefaultPaletteId,
      optionalLabel,
      dmgPalette,
      canAuto,
      autoPalette,
    ],
  );

  useEffect(() => {
    if (
      !createdPaletteId ||
      !options.some((option) => option.value === createdPaletteId)
    ) {
      return;
    }

    selectRef.current?.focusOption("last");
    setCreatedPaletteId(null);
  }, [createdPaletteId, options]);

  const currentValue = useMemo<PaletteOption>(() => {
    const matchingOption = options.find(
      (option) => option.value === (value ?? (optional ? "" : undefined)),
    );
    if (matchingOption) {
      return matchingOption;
    }
    if (optional) {
      return options.find((option) => option.value === "") as PaletteOption;
    }
    return {
      value: "",
      label: dmgPalette.name,
      palette: dmgPalette,
    };
  }, [options, optional, value, dmgPalette]);

  const onSelectChange = (newValue: SingleValue<Option>) => {
    if (newValue) {
      onChange?.(newValue.value);
    }
  };

  const onCreatePalette = useCallback(
    (inputValue: string) => {
      const name = inputValue.trim();
      if (!name) {
        return;
      }

      const menu = selectRef.current?.menuListRef?.closest(
        ".CustomSelect__menu",
      );
      const action = entitiesActions.addPalette({ name });
      dispatch(action);
      setSearchValue("");
      editingPaletteRef.current = true;
      setEditingPalette({
        id: action.payload.paletteId,
        offsetX: getEditorOffsetX(menu),
      });
      setCreatedPaletteId(action.payload.paletteId);
      (onCreate || onChange)?.(action.payload.paletteId);
    },
    [dispatch, onChange, onCreate],
  );

  const paletteBeingEdited = editingPalette
    ? palettesLookup[editingPalette.id]
    : undefined;

  return (
    <>
      {editingPalette && paletteBeingEdited && (
        <RelativePortal
          offsetX={editingPalette.offsetX}
          offsetY={0}
          zIndex={EDITOR_PORTAL_Z_INDEX}
        >
          <MenuOverlay
            onMouseDown={(event) => {
              event.preventDefault();
              closeEditor();
            }}
          />
          <PaletteEditorPanel
            ref={paletteEditorPanelRef}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <CustomPalettePicker
              paletteId={paletteBeingEdited.id}
              size="small"
            />
          </PaletteEditorPanel>
        </RelativePortal>
      )}
      <CreatableSelect
        ref={selectRef}
        name={name}
        value={currentValue}
        options={options}
        onChange={onSelectChange}
        onCreateOption={onCreatePalette}
        inputValue={searchValue}
        onInputChange={onSearchInputChange}
        formatOptionLabel={(option: PaletteOption) => {
          const editablePaletteId = option.palette
            ? palettesLookup[option.palette.id]?.id
            : undefined;
          return (
            <OptionLabelWithPreview
              preview={
                <PaletteBlock
                  type={type}
                  colors={option?.palette?.colors || []}
                  size={20}
                />
              }
            >
              <PaletteOptionLabel>
                <FormatFolderLabel label={option.label} />
              </PaletteOptionLabel>
              {editablePaletteId && (
                <OptionLabelHoverContent>
                  <EditPaletteButton
                    type="button"
                    title={l10n("FIELD_EDIT_PALETTES")}
                    aria-label={`${l10n("FIELD_EDIT_PALETTES")}: ${
                      option.label
                    }`}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onClick={(event) => onEditPalette(event, editablePaletteId)}
                  >
                    <PencilIcon />
                  </EditPaletteButton>
                </OptionLabelHoverContent>
              )}
            </OptionLabelWithPreview>
          );
        }}
        components={{
          SingleValue: () => (
            <SingleValueWithPreview
              preview={
                <PaletteBlock
                  type={type}
                  colors={currentValue?.palette?.colors || []}
                  size={20}
                />
              }
            >
              {prefix && <PaletteSelectPrefix>{prefix}</PaletteSelectPrefix>}
              <FormatFolderLabel label={currentValue?.label} />
            </SingleValueWithPreview>
          ),
        }}
        {...selectProps}
        onBlur={() => {
          if (!editingPaletteRef.current) {
            onBlur?.();
          }
        }}
      />
    </>
  );
};

export const PaletteSelect = memo<PaletteSelectProps>(PaletteSelectComponent);
