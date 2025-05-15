import {
  ConstScriptValue,
  ConstValueAtomType,
  isConstScriptValue,
  isValueAtom,
  isValueOperation,
  ScriptValue,
} from "shared/lib/scriptValue/types";
import React, { useCallback, useMemo, useRef } from "react";
import styled, { css } from "styled-components";
import { Button } from "ui/buttons/Button";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { InputGroup, InputGroupPrepend } from "ui/form/InputGroup";
import { NumberInput } from "ui/form/NumberInput";
import { BlankIcon, CheckIcon, ConstantIcon, NumberIcon } from "ui/icons/Icons";
import { MenuAccelerator, MenuDivider, MenuItem } from "ui/menu/Menu";
import {
  castEventToBool,
  castEventToInt,
} from "renderer/lib/helpers/castEventValue";
import l10n, { L10NKey } from "shared/lib/lang/l10n";
import { SliderField } from "ui/form/SliderField";
import { Select } from "ui/form/Select";
import { ensureNumber } from "shared/types";
import { CheckboxField } from "ui/form/CheckboxField";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import ItemTypes from "renderer/lib/dnd/itemTypes";
import { ClipboardTypeScriptValue } from "store/features/clipboard/clipboardTypes";
import { useAppDispatch, useAppSelector } from "store/hooks";
import clipboardActions from "store/features/clipboard/clipboardActions";
import { copy, paste } from "store/features/clipboard/clipboardHelpers";
import { constantSelectors } from "store/features/entities/entitiesState";
import { ConstantSelect } from "./ConstantSelect";
import { SingleValue } from "react-select";
import { optimiseScriptValue } from "shared/lib/scriptValue/helpers";

const iconLookup: Record<ConstValueAtomType, JSX.Element> = {
  number: <NumberIcon />,
  constant: <ConstantIcon />,
};

const l10nKeyLookup: Record<ConstValueAtomType, L10NKey> = {
  number: "FIELD_NUMBER",
  constant: "FIELD_CONSTANT",
};

interface ValueWrapperProps {
  $isOver: boolean;
}

const dropTargetStyle = css`
  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    border-radius: 4px;
    border: 2px solid ${(props) => props.theme.colors.highlight};
    background: rgba(128, 128, 128, 0.5);
    pointer-events: none;
  }
`;

const ValueWrapper = styled.div<ValueWrapperProps>`
  position: relative;
  display: flex;
  flex-grow: 1;
  align-items: center;
  min-width: 98px;
  flex-basis: 130px;
  ${(props) => (props.$isOver ? dropTargetStyle : "")}
`;

const DropWrapper = styled.div``;

interface BracketsWrapperProps {
  $isFunction?: boolean;
  $isOver?: boolean;
}

const BracketsWrapper = styled.div<BracketsWrapperProps>`
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 8px;
  flex-grow: 1;

  ${(props) =>
    !props.$isFunction
      ? css`
          padding: 0px 5px;

          flex-wrap: wrap;
          > * {
            margin: 2.5px;
          }

          border-left: 2px solid ${(props) => props.theme.colors.brackets.color};
          border-right: 2px solid
            ${(props) => props.theme.colors.brackets.color};
        `
      : ""}

  &:hover:not(:has(&:hover)) {
    background: ${(props) => props.theme.colors.brackets.hoverBackground};
  }

  ${(props) => (props.$isOver ? dropTargetStyle : "")}
`;

const Wrapper = styled.div`
  display: flex;
  position: relative;
  z-index: 0;
  > ${BracketsWrapper}:first-child {
    margin-top: -3px;
  }
`;

type ValueSelectInputOverride = {
  topLevelOnly: boolean;
} & (
  | {
      type: "number" | "slider";
    }
  | {
      type: "select";
      options?: [number, string][];
    }
  | {
      type: "checkbox";
      checkboxLabel: string;
    }
);

interface ConstantValueSelectProps {
  name: string;
  value?: ConstScriptValue;
  onChange: (newValue: ConstScriptValue) => void;
  innerValue?: boolean;
  fixedType?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  inputOverride?: ValueSelectInputOverride;
}

const ConstantValueSelect = ({
  name,
  value = { type: "number", value: 0 },
  onChange,
  innerValue,
  fixedType,
  placeholder,
  min,
  max,
  step,
  inputOverride,
}: ConstantValueSelectProps) => {
  const dispatch = useAppDispatch();
  const defaultConstant = useAppSelector(
    (state) => constantSelectors.selectAll(state)[0]
  );
  const isValueFn = isValueOperation(value);
  const dragRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const clipboardFormat = useAppSelector(
    (state) => state.clipboard.data?.format
  );

  const onCopyValue = useCallback(() => {
    copy({
      format: ClipboardTypeScriptValue,
      data: { value },
    });
  }, [value]);

  const onPasteValue = useCallback(async () => {
    const data = await paste(ClipboardTypeScriptValue);
    if (data) {
      const optimisedValue = optimiseScriptValue(data.data.value);
      if (isConstScriptValue(optimisedValue)) {
        onChange(optimisedValue);
      }
    }
  }, [onChange]);

  const onFetchClipboard = useCallback(() => {
    dispatch(clipboardActions.fetchClipboard());
  }, [dispatch]);

  const setNumber = useCallback(() => {
    onChange({
      type: "number",
      value: 0,
    });
  }, [onChange]);

  const setConstant = useCallback(() => {
    onChange({
      type: "constant",
      value: defaultConstant?.id ?? "",
    });
  }, [defaultConstant, onChange]);

  const onKeyDown = useCallback(
    (
      e: React.KeyboardEvent<HTMLButtonElement | HTMLInputElement | HTMLElement>
    ): boolean => {
      e.persist();
      if (e.metaKey || e.ctrlKey) {
        return false;
      }
      if (e.key === "n") {
        setNumber();
      } else if (e.key === "c") {
        setConstant();
      } else {
        return false;
      }
      e.stopPropagation();
      return true;
    },
    [setNumber, setConstant]
  );

  const menu = useMemo(
    () => [
      ...(!isValueFn
        ? [
            <MenuItem
              key="number"
              onClick={setNumber}
              icon={value.type === "number" ? <CheckIcon /> : <BlankIcon />}
            >
              {l10n("FIELD_NUMBER")}
              <MenuAccelerator accelerator="n" />
            </MenuItem>,
            <MenuItem
              key="constant"
              onClick={setConstant}
              icon={value.type === "constant" ? <CheckIcon /> : <BlankIcon />}
            >
              {l10n("FIELD_CONSTANT")}
              <MenuAccelerator accelerator="c" />
            </MenuItem>,
          ]
        : []),
      <MenuDivider key="divider2" />,
      <MenuItem key="copy" onClick={onCopyValue} icon={<BlankIcon />}>
        {l10n("FIELD_COPY_VALUE")}
      </MenuItem>,
      clipboardFormat === ClipboardTypeScriptValue && (
        <MenuItem key="paste" onClick={onPasteValue} icon={<BlankIcon />}>
          {l10n("FIELD_PASTE_VALUE")}
        </MenuItem>
      ),
    ],
    [
      clipboardFormat,
      isValueFn,
      onCopyValue,
      onPasteValue,
      setConstant,
      setNumber,
      value.type,
    ]
  );

  const options = useMemo(
    () =>
      ((inputOverride?.type === "select" && inputOverride?.options) || []).map(
        ([value, label]) => ({
          value,
          label: l10n(label as L10NKey),
        })
      ),
    [inputOverride]
  );

  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.SCRIPT_VALUE,
    collect(monitor) {
      return {
        isOver: monitor.isOver({ shallow: true }),
      };
    },
    drop(item: ScriptValue, monitor: DropTargetMonitor) {
      const didDrop = monitor.didDrop();
      if (didDrop) {
        return;
      }
      const optimisedValue = optimiseScriptValue(item);
      if (!isConstScriptValue(optimisedValue)) {
        return;
      }
      onChange(optimisedValue);
    },
  });

  const [_, drag, dragPreview] = useDrag({
    type: ItemTypes.SCRIPT_VALUE,
    item: (): ConstScriptValue => {
      return value;
    },
    options: {
      dropEffect: "copy",
    },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(dragRef);
  drop(dropRef);
  dragPreview(previewRef);

  const dropdownButton = useMemo(() => {
    if (fixedType) {
      return isValueAtom(value) ? (
        <Button size="small" title={l10n(l10nKeyLookup[value.type])} disabled>
          {iconLookup[value.type]}
        </Button>
      ) : null;
    }

    return (
      <DropWrapper ref={dragRef}>
        <DropdownButton
          label={iconLookup[value.type]}
          title={l10n(l10nKeyLookup[value.type])}
          size="small"
          showArrow={false}
          onKeyDown={onKeyDown}
          onMouseDown={onFetchClipboard}
          variant={"normal"}
        >
          {menu}
        </DropdownButton>
      </DropWrapper>
    );
  }, [fixedType, menu, onFetchClipboard, onKeyDown, value]);

  const input = useMemo(() => {
    if (value.type === "number") {
      return (
        <ValueWrapper ref={previewRef} $isOver={isOver}>
          <InputGroup ref={dropRef}>
            <InputGroupPrepend>{dropdownButton}</InputGroupPrepend>
            {((innerValue && !inputOverride?.topLevelOnly) ||
              !inputOverride ||
              inputOverride?.type === "number") && (
              <NumberInput
                id={name}
                type="number"
                value={String(
                  value.value !== undefined && value.value !== null
                    ? value.value
                    : ""
                )}
                min={innerValue ? undefined : min}
                max={innerValue ? undefined : max}
                step={innerValue ? undefined : step}
                placeholder={innerValue ? "0" : String(placeholder ?? "0")}
                onChange={(e) => {
                  onChange({
                    type: "number",
                    value: castEventToInt(e, 0),
                  });
                }}
                onKeyDown={onKeyDown}
              />
            )}
            {inputOverride?.type === "slider" &&
              (!innerValue || !inputOverride.topLevelOnly) && (
                <SliderField
                  name={name}
                  value={
                    value.value !== undefined && value.value !== null
                      ? value.value
                      : Number(placeholder ?? 0)
                  }
                  min={!innerValue && min ? min : 0}
                  max={!innerValue && max ? max : 0xffff}
                  placeholder={innerValue ? 0 : Number(placeholder ?? 0)}
                  onChange={(value) => {
                    if (value !== undefined) {
                      onChange({
                        type: "number",
                        value,
                      });
                    }
                  }}
                />
              )}
            {inputOverride?.type === "select" &&
              (!innerValue || !inputOverride.topLevelOnly) && (
                <Select
                  id={name}
                  name={name}
                  value={
                    options.find((o) =>
                      value.value
                        ? o.value === value.value
                        : o.value === value.value
                    ) || options[0]
                  }
                  options={options}
                  onChange={(e: SingleValue<{ value: number }>) => {
                    if (e) {
                      onChange({
                        type: "number",
                        value: ensureNumber(e.value, 0),
                      });
                    }
                  }}
                />
              )}
            {inputOverride?.type === "checkbox" &&
              (!innerValue || !inputOverride.topLevelOnly) && (
                <CheckboxField
                  name={name}
                  label={String(inputOverride.checkboxLabel || "")}
                  title={inputOverride.checkboxLabel}
                  checked={
                    value.value !== undefined && value.value !== null
                      ? Boolean(value.value)
                      : false
                  }
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    onChange({
                      type: "number",
                      value: castEventToBool(e) ? 1 : 0,
                    });
                  }}
                />
              )}
          </InputGroup>
        </ValueWrapper>
      );
    } else if (value.type === "constant") {
      return (
        <ValueWrapper ref={previewRef} $isOver={isOver}>
          <InputGroup ref={dropRef}>
            <InputGroupPrepend>{dropdownButton}</InputGroupPrepend>
            <ConstantSelect
              name={name}
              value={value.value}
              allowRename
              onChange={(newValue) => {
                onChange({
                  type: "constant",
                  value: newValue,
                });
              }}
            />
          </InputGroup>
        </ValueWrapper>
      );
    }
    return null;
  }, [
    dropdownButton,
    innerValue,
    inputOverride,
    isOver,
    max,
    min,
    name,
    onChange,
    onKeyDown,
    options,
    placeholder,
    step,
    value,
  ]);

  if (innerValue) {
    return input;
  }

  return <Wrapper>{input}</Wrapper>;
};

export default ConstantValueSelect;
