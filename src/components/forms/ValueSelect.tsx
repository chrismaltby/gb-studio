import DirectionPicker from "components/forms/DirectionPicker";
import { PropertySelect } from "components/forms/PropertySelect";
import { VariableSelect } from "components/forms/VariableSelect";
import {
  isInfix,
  isUnaryOperation,
  isValueAtom,
  isValueOperation,
  isValueUnaryOperatorType,
  ScriptValue,
  ValueAtomType,
  ValueOperatorType,
  ValueUnaryOperatorType,
} from "shared/lib/scriptValue/types";
import React, { useCallback, useContext, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/configureStore";
import styled, { css } from "styled-components";
import { Button } from "ui/buttons/Button";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { InputGroup, InputGroupPrepend } from "ui/form/InputGroup";
import { NumberInput } from "ui/form/NumberInput";
import {
  ActorIcon,
  BlankIcon,
  CheckIcon,
  CompassIcon,
  ConstantIcon,
  CrossIcon,
  DivideIcon,
  ExpressionIcon,
  FalseIcon,
  MinusIcon,
  ModuloIcon,
  NotIcon,
  NumberIcon,
  PlusIcon,
  SquareRootIcon,
  TrueIcon,
  VariableIcon,
} from "ui/icons/Icons";
import { MenuAccelerator, MenuDivider, MenuItem } from "ui/menu/Menu";
import { ScriptEditorContext } from "components/script/ScriptEditorContext";
import ScriptEventFormMathArea from "components/script/ScriptEventFormMatharea";
import { ActorDirection } from "shared/lib/entities/entitiesTypes";
import {
  castEventToBool,
  castEventToFloat,
  castEventToInt,
} from "renderer/lib/helpers/castEventValue";
import l10n, { L10NKey } from "shared/lib/lang/l10n";
import L10NText from "ui/form/L10NText";
import { SliderField } from "ui/form/SliderField";
import { Select } from "ui/form/Select";
import { ensureNumber } from "shared/types";
import { CheckboxField } from "ui/form/CheckboxField";
import { Input } from "ui/form/Input";
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

type ValueFunctionMenuItem = {
  value: ValueOperatorType | ValueUnaryOperatorType;
  label: React.ReactNode;
  symbol?: string;
};

const TextIcon = styled.div`
  line-height: 0;
  font-weight: bold;
  font-style: italic;
`;

const iconLookup: Record<
  ValueAtomType | ValueOperatorType | ValueUnaryOperatorType | "rnd",
  JSX.Element
> = {
  // Value
  number: <NumberIcon />,
  direction: <CompassIcon />,
  variable: <VariableIcon />,
  indirect: <VariableIcon />,
  constant: <ConstantIcon />,
  expression: <ExpressionIcon />,
  property: <ActorIcon />,
  true: <TrueIcon />,
  false: <FalseIcon />,
  // Math
  add: <PlusIcon />,
  sub: <MinusIcon />,
  mul: <CrossIcon />,
  div: <DivideIcon />,
  mod: <ModuloIcon />,
  eq: <TextIcon>==</TextIcon>,
  ne: <TextIcon>!=</TextIcon>,
  gt: <TextIcon>&gt;</TextIcon>,
  gte: <TextIcon>&gt;=</TextIcon>,
  lt: <TextIcon>&lt;</TextIcon>,
  lte: <TextIcon>&lt;=</TextIcon>,
  and: <TextIcon>&amp;&amp;</TextIcon>,
  or: <TextIcon>||</TextIcon>,
  not: <NotIcon />,
  min: <TextIcon>min</TextIcon>,
  max: <TextIcon>max</TextIcon>,
  abs: <TextIcon>abs</TextIcon>,
  atan2: <TextIcon>atan2</TextIcon>,
  isqrt: <SquareRootIcon />,
  rnd: <TextIcon>rnd</TextIcon>,
  // bitwise
  shl: <TextIcon>&lt;&lt;</TextIcon>,
  shr: <TextIcon>&gt;&gt;</TextIcon>,
  bAND: <TextIcon>&amp;</TextIcon>,
  bOR: <TextIcon>|</TextIcon>,
  bXOR: <TextIcon>^</TextIcon>,
  bNOT: <TextIcon>~</TextIcon>,
};

const l10nKeyLookup: Record<
  ValueAtomType | ValueOperatorType | ValueUnaryOperatorType | "rnd",
  L10NKey
> = {
  // Value
  number: "FIELD_NUMBER",
  direction: "FIELD_DIRECTION",
  variable: "FIELD_VARIABLE",
  indirect: "FIELD_VARIABLE",
  constant: "FIELD_CONSTANT",
  expression: "FIELD_EXPRESSION",
  property: "FIELD_PROPERTY",
  true: "FIELD_TRUE",
  false: "FIELD_FALSE",
  // Math
  add: "FIELD_ADD_VALUE",
  sub: "FIELD_SUB_VALUE",
  mul: "FIELD_MUL_VARIABLE",
  div: "FIELD_DIV_VARIABLE",
  mod: "FIELD_MOD_VARIABLE",
  eq: "FIELD_EQ",
  ne: "FIELD_NE",
  gt: "FIELD_GT",
  gte: "FIELD_GTE",
  lt: "FIELD_LT",
  lte: "FIELD_LTE",
  and: "FIELD_AND",
  or: "FIELD_OR",
  not: "FIELD_NOT",
  min: "FIELD_MIN",
  max: "FIELD_MAX",
  abs: "FIELD_ABSOLUTE_VALUE",
  atan2: "FIELD_ATAN2",
  isqrt: "FIELD_SQUARE_ROOT",
  rnd: "FIELD_RANDOM",
  // bitwise
  shl: "FIELD_LEFT_SHIFT",
  shr: "FIELD_RIGHT_SHIFT",
  bAND: "FIELD_BITWISE_AND",
  bOR: "FIELD_BITWISE_OR",
  bXOR: "FIELD_BITWISE_XOR",
  bNOT: "FIELD_BITWISE_NOT",
};

const operatorMenuItems: ValueFunctionMenuItem[] = [
  {
    value: "add",
    label: <L10NText l10nKey="FIELD_ADD_VALUE" />,
    symbol: "+",
  },
  {
    value: "sub",
    label: <L10NText l10nKey="FIELD_SUB_VALUE" />,
    symbol: "-",
  },
  {
    value: "mul",
    label: <L10NText l10nKey="FIELD_MUL_VARIABLE" />,
    symbol: "*",
  },
  {
    value: "div",
    label: <L10NText l10nKey="FIELD_DIV_VARIABLE" />,
    symbol: "/",
  },
  {
    value: "mod",
    label: <L10NText l10nKey="FIELD_MOD_VARIABLE" />,
    symbol: "%",
  },
];

const comparisonMenuItems: ValueFunctionMenuItem[] = [
  {
    value: "eq",
    label: <L10NText l10nKey="FIELD_EQ" />,
    symbol: "=",
  },
  {
    value: "ne",
    label: <L10NText l10nKey="FIELD_NE" />,
    symbol: "N",
  },
  {
    value: "gt",
    label: <L10NText l10nKey="FIELD_GT" />,
    symbol: ">",
  },
  {
    value: "gte",
    label: <L10NText l10nKey="FIELD_GTE" />,
    symbol: "G",
  },
  {
    value: "lt",
    label: <L10NText l10nKey="FIELD_LT" />,
    symbol: "<",
  },
  {
    value: "lte",
    label: <L10NText l10nKey="FIELD_LTE" />,
    symbol: "L",
  },
];

const bitwiseMenuItems: ValueFunctionMenuItem[] = [
  { value: "shl", label: <L10NText l10nKey="FIELD_LEFT_SHIFT" /> },
  { value: "shr", label: <L10NText l10nKey="FIELD_RIGHT_SHIFT" /> },
  { value: "bAND", label: <L10NText l10nKey="FIELD_BITWISE_AND" /> },
  { value: "bOR", label: <L10NText l10nKey="FIELD_BITWISE_OR" /> },
  { value: "bXOR", label: <L10NText l10nKey="FIELD_BITWISE_XOR" /> },
  { value: "bNOT", label: <L10NText l10nKey="FIELD_BITWISE_NOT" /> },
];

const functionMenuItems: ValueFunctionMenuItem[] = [
  {
    value: "min",
    label: "Min",
    symbol: "m",
  },
  {
    value: "max",
    label: "Max",
    symbol: "M",
  },
  { value: "abs", label: <L10NText l10nKey="FIELD_ABSOLUTE_VALUE" /> },
  { value: "atan2", label: "atan2" },
  { value: "isqrt", label: <L10NText l10nKey="FIELD_SQUARE_ROOT" /> },
];

const booleanOperatorMenuItems: ValueFunctionMenuItem[] = [
  {
    value: "and",
    label: <L10NText l10nKey="FIELD_AND" />,
    symbol: "&",
  },
  {
    value: "or",
    label: <L10NText l10nKey="FIELD_OR" />,
    symbol: "|",
  },
  {
    value: "not",
    label: <L10NText l10nKey="FIELD_NOT" />,
    symbol: "!",
  },
];

interface ValueWrapperProps {
  $isOver: boolean;
}

const OperatorWrapper = styled.div`
  min-width: 24px;
  flex-shrink: 0;
  flex-grow: 0;
`;

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

const noop = () => {};

interface ValueSelectProps {
  name: string;
  entityId: string;
  value?: ScriptValue;
  onChange: (newValue: ScriptValue) => void;
  innerValue?: boolean;
  fixedType?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  inputOverride?: ValueSelectInputOverride;
}

const ValueSelect = ({
  name,
  entityId,
  value = { type: "number", value: 0 },
  onChange,
  innerValue,
  fixedType,
  placeholder,
  min,
  max,
  step,
  inputOverride,
}: ValueSelectProps) => {
  const dispatch = useAppDispatch();
  const context = useContext(ScriptEditorContext);
  const editorType = useSelector((state: RootState) => state.editor.type);
  const defaultConstant = useAppSelector(
    (state) => constantSelectors.selectAll(state)[0],
  );
  const isValueFn = isValueOperation(value);
  const dragRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const clipboardFormat = useAppSelector(
    (state) => state.clipboard.data?.format,
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
      onChange(data.data.value);
    }
  }, [onChange]);

  const onFetchClipboard = useCallback(() => {
    dispatch(clipboardActions.fetchClipboard());
  }, [dispatch]);

  const focus = useCallback(() => {
    setTimeout(() => {
      document.getElementById(name)?.focus();
    }, 150);
  }, [name]);

  const focusSecondChild = useCallback(() => {
    setTimeout(() => {
      document.getElementById(`${name}_valueB`)?.focus();
    }, 150);
  }, [name]);

  const setNumber = useCallback(() => {
    onChange({
      type: "number",
      value: 0,
    });
  }, [onChange]);

  const setVariable = useCallback(() => {
    const defaultVariable =
      context.type === "script"
        ? "V0"
        : context.type === "entity"
          ? "L0"
          : // Default
            "0";
    onChange({
      type: "variable",
      value: defaultVariable,
    });
  }, [context.type, onChange]);

  const setConstant = useCallback(() => {
    onChange({
      type: "constant",
      value: defaultConstant?.id ?? "",
    });
  }, [defaultConstant, onChange]);

  const setProperty = useCallback(() => {
    onChange({
      type: "property",
      target:
        context.type === "entity" && editorType === "actor"
          ? "$self$"
          : "player",
      property: "xpos",
    });
  }, [context.type, editorType, onChange]);

  const setExpression = useCallback(() => {
    onChange({
      type: "expression",
      value: "",
    });
  }, [onChange]);

  const setDirection = useCallback(() => {
    onChange({
      type: "direction",
      value: "left",
    });
  }, [onChange]);

  const setBool = useCallback(
    (bool: boolean) => {
      onChange({
        type: bool ? "true" : "false",
      });
    },
    [onChange],
  );

  const setValueFunction = useCallback(
    (type: ValueOperatorType | ValueUnaryOperatorType) => {
      if (isValueUnaryOperatorType(type)) {
        onChange({
          type,
          value,
        });
        focus();
      } else {
        if (isValueOperation(value)) {
          onChange({
            type,
            valueA: value.valueA,
            valueB: value.valueB,
          });
          focus();
        } else {
          onChange({
            type,
            valueA: value,
            valueB: {
              type: "number",
              value: 0,
            },
          });
          focusSecondChild();
        }
      }
    },
    [focus, focusSecondChild, onChange, value],
  );

  const onKeyDown = useCallback(
    (
      e: React.KeyboardEvent<
        HTMLButtonElement | HTMLInputElement | HTMLElement
      >,
    ): boolean => {
      e.persist();
      if (e.metaKey || e.ctrlKey) {
        return false;
      }
      if (e.key === "n") {
        setNumber();
      } else if (e.key === "$") {
        setVariable();
      } else if (e.key === "c") {
        setConstant();
      } else if (e.key === "p") {
        setProperty();
      } else if (e.key === "e") {
        setExpression();
      } else if (e.key === "d") {
        setDirection();
      } else if (e.key === "t") {
        setBool(true);
      } else if (e.key === "f") {
        setBool(false);
      } else if (e.key === "+") {
        setValueFunction("add");
      } else if (e.key === "-") {
        if (e.currentTarget.nodeName === "BUTTON") {
          setValueFunction("sub");
        }
      } else if (e.key === "*") {
        setValueFunction("mul");
      } else if (e.key === "/") {
        setValueFunction("div");
      } else if (e.key === "%") {
        setValueFunction("mod");
      } else if (e.key === "m") {
        setValueFunction("min");
      } else if (e.key === "M") {
        setValueFunction("max");
      } else if (e.key === "=") {
        setValueFunction("eq");
      } else if (e.key === "N") {
        setValueFunction("ne");
      } else if (e.key === ">") {
        setValueFunction("gt");
      } else if (e.key === "<") {
        setValueFunction("lt");
      } else if (e.key === "G") {
        setValueFunction("gte");
      } else if (e.key === "L") {
        setValueFunction("lte");
      } else if (e.key === "r") {
        setValueFunction("rnd");
      } else if (e.key === "&") {
        setValueFunction("and");
      } else if (e.key === "|") {
        setValueFunction("or");
      } else if (e.key === "!") {
        setValueFunction("not");
      } else {
        return false;
      }
      e.stopPropagation();
      return true;
    },
    [
      setBool,
      setDirection,
      setExpression,
      setNumber,
      setProperty,
      setValueFunction,
      setVariable,
      setConstant,
    ],
  );

  const mathMenu = useMemo(
    () => [
      ...operatorMenuItems.map((menuItem) => (
        <MenuItem
          key={menuItem.value}
          onClick={() => setValueFunction(menuItem.value)}
          icon={value.type === menuItem.value ? <CheckIcon /> : <BlankIcon />}
        >
          {menuItem.label}
          {menuItem.symbol && <MenuAccelerator accelerator={menuItem.symbol} />}
        </MenuItem>
      )),
      <MenuDivider key="div1" />,
      ...functionMenuItems.map((menuItem) => (
        <MenuItem
          key={menuItem.value}
          onClick={() => setValueFunction(menuItem.value)}
          icon={value.type === menuItem.value ? <CheckIcon /> : <BlankIcon />}
        >
          {menuItem.label}
          {menuItem.symbol && <MenuAccelerator accelerator={menuItem.symbol} />}
        </MenuItem>
      )),
      <MenuDivider key="div2" />,
      <MenuItem
        key="rnd"
        onClick={() => setValueFunction("rnd")}
        icon={value.type === "rnd" ? <CheckIcon /> : <BlankIcon />}
      >
        {l10n("FIELD_RANDOM")}
        <MenuAccelerator accelerator="r" />
      </MenuItem>,
    ],
    [setValueFunction, value.type],
  );

  const booleanMenu = useMemo(
    () => [
      <MenuItem
        key="true"
        onClick={() => {
          onChange({
            type: "true",
          });
        }}
        icon={value.type === "true" ? <CheckIcon /> : <BlankIcon />}
      >
        {l10n("FIELD_TRUE")}
        <MenuAccelerator accelerator="t" />
      </MenuItem>,
      <MenuItem
        key="false"
        onClick={() => {
          onChange({
            type: "false",
          });
        }}
        icon={value.type === "false" ? <CheckIcon /> : <BlankIcon />}
      >
        {l10n("FIELD_FALSE")}
        <MenuAccelerator accelerator="f" />
      </MenuItem>,
      <MenuDivider key="div1" />,
      ...booleanOperatorMenuItems.map((menuItem) => (
        <MenuItem
          key={menuItem.value}
          onClick={() => setValueFunction(menuItem.value)}
          icon={value.type === menuItem.value ? <CheckIcon /> : <BlankIcon />}
        >
          {menuItem.label}
          {menuItem.symbol && <MenuAccelerator accelerator={menuItem.symbol} />}
        </MenuItem>
      )),
    ],
    [onChange, setValueFunction, value.type],
  );

  const comparisonMenu = useMemo(
    () => [
      ...comparisonMenuItems.map((menuItem) => (
        <MenuItem
          key={menuItem.value}
          onClick={() => setValueFunction(menuItem.value)}
          icon={value.type === menuItem.value ? <CheckIcon /> : <BlankIcon />}
        >
          {menuItem.label}
          {menuItem.symbol && <MenuAccelerator accelerator={menuItem.symbol} />}
        </MenuItem>
      )),
    ],
    [setValueFunction, value.type],
  );

  const bitwiseMenu = useMemo(
    () => [
      ...bitwiseMenuItems.map((menuItem) => (
        <MenuItem
          key={menuItem.value}
          onClick={() => setValueFunction(menuItem.value)}
          icon={value.type === menuItem.value ? <CheckIcon /> : <BlankIcon />}
        >
          {menuItem.label}
          {menuItem.symbol && <MenuAccelerator accelerator={menuItem.symbol} />}
        </MenuItem>
      )),
    ],
    [setValueFunction, value.type],
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
              key="variable"
              onClick={setVariable}
              icon={value.type === "variable" ? <CheckIcon /> : <BlankIcon />}
            >
              {l10n("FIELD_VARIABLE")}
              <MenuAccelerator accelerator="$" />
            </MenuItem>,
            <MenuItem
              key="constant"
              onClick={setConstant}
              icon={value.type === "constant" ? <CheckIcon /> : <BlankIcon />}
            >
              {l10n("FIELD_CONSTANT")}
              <MenuAccelerator accelerator="c" />
            </MenuItem>,
            <MenuItem
              key="property"
              onClick={setProperty}
              icon={value.type === "property" ? <CheckIcon /> : <BlankIcon />}
            >
              {l10n("FIELD_PROPERTY")}
              <MenuAccelerator accelerator="p" />
            </MenuItem>,
            <MenuItem
              key="expression"
              onClick={setExpression}
              icon={value.type === "expression" ? <CheckIcon /> : <BlankIcon />}
            >
              {l10n("FIELD_EXPRESSION")}
              <MenuAccelerator accelerator="e" />
            </MenuItem>,
            <MenuItem
              key="direction"
              onClick={setDirection}
              icon={value.type === "direction" ? <CheckIcon /> : <BlankIcon />}
            >
              {l10n("FIELD_DIRECTION")}
              <MenuAccelerator accelerator="d" />
            </MenuItem>,
            <MenuDivider key="divider1" />,
          ]
        : []),
      <MenuItem key="mathMenu" subMenu={mathMenu} icon={<BlankIcon />}>
        {l10n("EVENT_GROUP_MATH")}
      </MenuItem>,
      <MenuItem key="booleanMenu" subMenu={booleanMenu} icon={<BlankIcon />}>
        {l10n("FIELD_BOOLEAN")}
      </MenuItem>,
      <MenuItem
        key="comparisonMenu"
        subMenu={comparisonMenu}
        icon={<BlankIcon />}
      >
        {l10n("FIELD_COMPARISON")}
      </MenuItem>,
      <MenuItem key="bitwiseMenu" subMenu={bitwiseMenu} icon={<BlankIcon />}>
        {l10n("FIELD_BITWISE")}
      </MenuItem>,
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
      bitwiseMenu,
      booleanMenu,
      clipboardFormat,
      comparisonMenu,
      isValueFn,
      mathMenu,
      onCopyValue,
      onPasteValue,
      setConstant,
      setDirection,
      setExpression,
      setNumber,
      setProperty,
      setVariable,
      value.type,
    ],
  );

  const options = useMemo(
    () =>
      ((inputOverride?.type === "select" && inputOverride?.options) || []).map(
        ([value, label]) => ({
          value,
          label: l10n(label as L10NKey),
        }),
      ),
    [inputOverride],
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
      onChange(item);
    },
  });

  const [_, drag, dragPreview] = useDrag({
    type: ItemTypes.SCRIPT_VALUE,
    item: (): ScriptValue => {
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

    const isOperation = isUnaryOperation(value) || isValueOperation(value);

    return (
      <DropWrapper ref={dragRef}>
        <DropdownButton
          label={iconLookup[value.type]}
          title={l10n(l10nKeyLookup[value.type])}
          size="small"
          showArrow={false}
          onKeyDown={onKeyDown}
          onMouseDown={onFetchClipboard}
          variant={isOperation ? "transparent" : "normal"}
        >
          {menu}
          {isOperation ? <MenuDivider /> : null}
          {isUnaryOperation(value) ? (
            <MenuItem
              onClick={() => {
                onChange(value.value);
                focus();
              }}
              icon={<BlankIcon />}
            >
              {l10n("FIELD_REMOVE")}
            </MenuItem>
          ) : null}
          {isValueOperation(value) ? (
            <MenuItem
              onClick={() => {
                onChange(value.valueA);
                focus();
              }}
              icon={<BlankIcon />}
            >
              {l10n("FIELD_REMOVE")}
            </MenuItem>
          ) : null}
        </DropdownButton>
      </DropWrapper>
    );
  }, [fixedType, focus, menu, onChange, onFetchClipboard, onKeyDown, value]);

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
                    : "",
                )}
                min={innerValue ? undefined : min}
                max={innerValue ? undefined : max}
                step={innerValue ? undefined : step}
                placeholder={innerValue ? "0" : String(placeholder ?? "0")}
                onChange={(e) => {
                  onChange({
                    type: "number",
                    value:
                      (step ?? 1) % 1 === 0
                        ? castEventToInt(e, 0)
                        : castEventToFloat(e, 0),
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
                        : o.value === value.value,
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
    } else if (value.type === "direction") {
      return (
        <ValueWrapper ref={previewRef} $isOver={isOver}>
          <InputGroup ref={dropRef}>
            <InputGroupPrepend>{dropdownButton}</InputGroupPrepend>
            <DirectionPicker
              id={name}
              value={value.value as ActorDirection}
              onChange={(newValue: string) => {
                onChange({
                  type: "direction",
                  value: newValue,
                });
              }}
            />
          </InputGroup>
        </ValueWrapper>
      );
    } else if (value.type === "variable") {
      return (
        <ValueWrapper ref={previewRef} $isOver={isOver}>
          <InputGroup ref={dropRef}>
            <InputGroupPrepend>{dropdownButton}</InputGroupPrepend>
            <VariableSelect
              name={name}
              entityId={entityId}
              value={value.value}
              allowRename
              onChange={(newValue) => {
                onChange({
                  type: "variable",
                  value: newValue,
                });
              }}
            />
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
    } else if (value.type === "property") {
      return (
        <ValueWrapper ref={previewRef} $isOver={isOver}>
          <InputGroup ref={dropRef}>
            <InputGroupPrepend>{dropdownButton}</InputGroupPrepend>
            <PropertySelect
              name={name}
              value={`${value.target}:${value.property}`}
              onChange={(newValue) => {
                const targetValue = newValue.replace(/:.*/, "");
                const propertyValue = newValue.replace(/.*:/, "");
                onChange({
                  type: "property",
                  target: targetValue,
                  property: propertyValue,
                });
              }}
            />
          </InputGroup>
        </ValueWrapper>
      );
    } else if (value.type === "expression") {
      return (
        <ValueWrapper ref={previewRef} $isOver={isOver}>
          <InputGroup ref={dropRef}>
            <InputGroupPrepend>{dropdownButton}</InputGroupPrepend>
            <ScriptEventFormMathArea
              id={name}
              value={value.value}
              placeholder="e.g. $health >= 0..."
              onChange={(newExpression: string) => {
                onChange({
                  type: "expression",
                  value: newExpression,
                });
              }}
              entityId={entityId}
            />
          </InputGroup>
        </ValueWrapper>
      );
    } else if (value.type === "true") {
      return (
        <ValueWrapper ref={previewRef} $isOver={isOver}>
          <InputGroup ref={dropRef}>
            <InputGroupPrepend>{dropdownButton}</InputGroupPrepend>
            <Input
              value={l10n("FIELD_TRUE")}
              onChange={noop}
              onKeyDown={onKeyDown}
            />
          </InputGroup>
        </ValueWrapper>
      );
    } else if (value.type === "false") {
      return (
        <ValueWrapper ref={previewRef} $isOver={isOver}>
          <InputGroup ref={dropRef}>
            <InputGroupPrepend>{dropdownButton}</InputGroupPrepend>
            <Input
              value={l10n("FIELD_FALSE")}
              onChange={noop}
              onKeyDown={onKeyDown}
            />
          </InputGroup>
        </ValueWrapper>
      );
    } else if (isUnaryOperation(value)) {
      return (
        <BracketsWrapper ref={previewRef} $isOver={isOver} $isFunction>
          <OperatorWrapper ref={dropRef}>{dropdownButton}</OperatorWrapper>
          <BracketsWrapper>
            <ValueSelect
              name={`${name}_valueA`}
              entityId={entityId}
              value={value.value}
              onChange={(newValue) => {
                onChange({
                  ...value,
                  value: newValue,
                });
              }}
              innerValue
            />
          </BracketsWrapper>
        </BracketsWrapper>
      );
    } else if (isValueOperation(value)) {
      if (isInfix(value.type)) {
        return (
          <BracketsWrapper ref={previewRef} $isOver={isOver}>
            <ValueSelect
              name={`${name}_valueA`}
              entityId={entityId}
              value={value.valueA}
              onChange={(newValue) => {
                onChange({
                  ...value,
                  valueA: newValue,
                });
              }}
              innerValue
            />
            <OperatorWrapper ref={dropRef}>{dropdownButton}</OperatorWrapper>
            <ValueSelect
              name={`${name}_valueB`}
              entityId={entityId}
              value={value.valueB}
              onChange={(newValue) => {
                onChange({
                  ...value,
                  valueB: newValue,
                });
              }}
              innerValue
            />
          </BracketsWrapper>
        );
      } else {
        return (
          <BracketsWrapper ref={previewRef} $isOver={isOver} $isFunction>
            <OperatorWrapper ref={dropRef}>{dropdownButton}</OperatorWrapper>
            <BracketsWrapper>
              <ValueSelect
                name={`${name}_valueA`}
                entityId={entityId}
                value={value.valueA}
                onChange={(newValue) => {
                  onChange({
                    ...value,
                    valueA: newValue,
                  });
                }}
                innerValue
              />
              ,
              <ValueSelect
                name={`${name}_valueB`}
                entityId={entityId}
                value={value.valueB}
                onChange={(newValue) => {
                  onChange({
                    ...value,
                    valueB: newValue,
                  });
                }}
                innerValue
              />
            </BracketsWrapper>
          </BracketsWrapper>
        );
      }
    }
    return null;
  }, [
    dropdownButton,
    entityId,
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

export default ValueSelect;
