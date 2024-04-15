import DirectionPicker from "components/forms/DirectionPicker";
import { PropertySelect } from "components/forms/PropertySelect";
import { VariableSelect } from "components/forms/VariableSelect";
import {
  isValueAtom,
  isValueOperation,
  isValueUnaryOperatorType,
  ScriptValue,
  ValueAtomType,
  ValueOperatorType,
  ValueUnaryOperatorType,
} from "shared/lib/scriptValue/types";
import React, { useCallback, useContext, useMemo } from "react";
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
  CrossIcon,
  DivideIcon,
  ExpressionIcon,
  FalseIcon,
  MinusIcon,
  ModuloIcon,
  NotIcon,
  NumberIcon,
  PlusIcon,
  TrueIcon,
  VariableIcon,
} from "ui/icons/Icons";
import {
  MenuAccelerator,
  MenuDivider,
  MenuItem,
  MenuItemIcon,
} from "ui/menu/Menu";
import { ScriptEditorContext } from "components/script/ScriptEditorContext";
import ScriptEventFormMathArea from "components/script/ScriptEventFormMatharea";
import { ActorDirection } from "shared/lib/entities/entitiesTypes";
import {
  castEventToBool,
  castEventToInt,
} from "renderer/lib/helpers/castEventValue";
import l10n, { L10NKey } from "shared/lib/lang/l10n";
import L10NText from "ui/form/L10NText";
import { SliderField } from "ui/form/SliderField";
import { Option, Select } from "ui/form/Select";
import { ensureNumber } from "shared/types";
import { CheckboxField } from "ui/form/CheckboxField";
import { Input } from "ui/form/Input";

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
  ValueAtomType | ValueOperatorType | ValueUnaryOperatorType,
  JSX.Element
> = {
  // Value
  number: <NumberIcon />,
  direction: <CompassIcon />,
  variable: <VariableIcon />,
  indirect: <VariableIcon />,
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
  // bitwise
  shl: <TextIcon>&lt;&lt;</TextIcon>,
  shr: <TextIcon>&gt;&gt;</TextIcon>,
  bAND: <TextIcon>&amp;</TextIcon>,
  bOR: <TextIcon>|</TextIcon>,
  bXOR: <TextIcon>^</TextIcon>,
  bNOT: <TextIcon>~</TextIcon>,
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

const OperatorWrapper = styled.div`
  min-width: 24px;
  flex-shrink: 0;
  flex-grow: 0;
`;

const ValueWrapper = styled.div`
  display: flex;
  flex-grow: 1;
  align-items: center;
  min-width: 98px;
  flex-basis: 130px;
`;

interface BracketsWrapperProps {
  isFunction?: boolean;
}

const BracketsWrapper = styled.div<BracketsWrapperProps>`
  display: flex;
  align-items: center;
  border-radius: 8px;
  flex-grow: 1;

  ${(props) =>
    !props.isFunction
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
`;

const Wrapper = styled.div`
  display: flex;
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
  const context = useContext(ScriptEditorContext);
  const editorType = useSelector((state: RootState) => state.editor.type);
  const isValueFn = isValueOperation(value);

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
    [onChange]
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
    [focus, focusSecondChild, onChange, value]
  );

  const setRandom = useCallback(() => {
    const valueA =
      "valueA" in value && value.valueA && value.valueA.type === "number"
        ? value.valueA
        : {
            type: "number" as const,
            value: 0,
          };
    const valueB =
      "valueB" in value && value.valueB && value.valueB.type === "number"
        ? value.valueB
        : {
            type: "number" as const,
            value: 0,
          };
    onChange({
      type: "rnd",
      valueA: valueA,
      valueB: valueB,
    });
    if (valueA.value) {
      focusSecondChild();
    } else {
      focus();
    }
  }, [focus, focusSecondChild, onChange, value]);

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
      } else if (e.key === "$") {
        setVariable();
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
        // Need to check input isn't empty
        // to still allow negative numbers in number fields
        const hasSelection =
          e.currentTarget instanceof HTMLInputElement &&
          (window.getSelection()?.toString().length ?? 0) > 0;
        if (
          e.currentTarget.nodeName === "BUTTON" ||
          ("value" in e.currentTarget &&
            e.currentTarget.value.trim().length > 0 &&
            !hasSelection)
        ) {
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
        setRandom();
      } else if (e.key === "&") {
        setValueFunction("and");
      } else if (e.key === "|") {
        setValueFunction("or");
      } else if (e.key === "!") {
        setValueFunction("not");
      } else {
        return false;
      }
      return true;
    },
    [
      setBool,
      setDirection,
      setExpression,
      setNumber,
      setProperty,
      setRandom,
      setValueFunction,
      setVariable,
    ]
  );

  const mathMenu = useMemo(
    () => [
      ...operatorMenuItems.map((menuItem) => (
        <MenuItem
          key={menuItem.value}
          onClick={() => setValueFunction(menuItem.value)}
        >
          <MenuItemIcon>
            {value.type === menuItem.value ? <CheckIcon /> : <BlankIcon />}
          </MenuItemIcon>
          {menuItem.label}
          {menuItem.symbol && <MenuAccelerator accelerator={menuItem.symbol} />}
        </MenuItem>
      )),
      <MenuDivider key="div1" />,
      ...functionMenuItems.map((menuItem) => (
        <MenuItem
          key={menuItem.value}
          onClick={() => setValueFunction(menuItem.value)}
        >
          <MenuItemIcon>
            {value.type === menuItem.value ? <CheckIcon /> : <BlankIcon />}
          </MenuItemIcon>
          {menuItem.label}
          {menuItem.symbol && <MenuAccelerator accelerator={menuItem.symbol} />}
        </MenuItem>
      )),
      <MenuDivider key="div2" />,
      <MenuItem key="rnd" onClick={setRandom}>
        <MenuItemIcon>
          {value.type === "rnd" ? <CheckIcon /> : <BlankIcon />}
        </MenuItemIcon>
        {l10n("FIELD_RANDOM")}
        <MenuAccelerator accelerator="r" />
      </MenuItem>,
    ],
    [setRandom, setValueFunction, value.type]
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
      >
        <MenuItemIcon>
          {value.type === "true" ? <CheckIcon /> : <BlankIcon />}
        </MenuItemIcon>
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
      >
        <MenuItemIcon>
          {value.type === "false" ? <CheckIcon /> : <BlankIcon />}
        </MenuItemIcon>
        {l10n("FIELD_FALSE")}
        <MenuAccelerator accelerator="f" />
      </MenuItem>,
      <MenuDivider key="div1" />,
      ...booleanOperatorMenuItems.map((menuItem) => (
        <MenuItem
          key={menuItem.value}
          onClick={() => setValueFunction(menuItem.value)}
        >
          <MenuItemIcon>
            {value.type === menuItem.value ? <CheckIcon /> : <BlankIcon />}
          </MenuItemIcon>
          {menuItem.label}
          {menuItem.symbol && <MenuAccelerator accelerator={menuItem.symbol} />}
        </MenuItem>
      )),
    ],
    [onChange, setValueFunction, value.type]
  );

  const comparisonMenu = useMemo(
    () => [
      ...comparisonMenuItems.map((menuItem) => (
        <MenuItem
          key={menuItem.value}
          onClick={() => setValueFunction(menuItem.value)}
        >
          <MenuItemIcon>
            {value.type === menuItem.value ? <CheckIcon /> : <BlankIcon />}
          </MenuItemIcon>
          {menuItem.label}
          {menuItem.symbol && <MenuAccelerator accelerator={menuItem.symbol} />}
        </MenuItem>
      )),
    ],
    [setValueFunction, value.type]
  );

  const bitwiseMenu = useMemo(
    () => [
      ...bitwiseMenuItems.map((menuItem) => (
        <MenuItem
          key={menuItem.value}
          onClick={() => setValueFunction(menuItem.value)}
        >
          <MenuItemIcon>
            {value.type === menuItem.value ? <CheckIcon /> : <BlankIcon />}
          </MenuItemIcon>
          {menuItem.label}
          {menuItem.symbol && <MenuAccelerator accelerator={menuItem.symbol} />}
        </MenuItem>
      )),
    ],
    [setValueFunction, value.type]
  );

  const menu = useMemo(
    () => [
      ...(!isValueFn
        ? [
            <MenuItem key="number" onClick={setNumber}>
              <MenuItemIcon>
                {value.type === "number" ? <CheckIcon /> : <BlankIcon />}
              </MenuItemIcon>
              {l10n("FIELD_NUMBER")}
              <MenuAccelerator accelerator="n" />
            </MenuItem>,

            <MenuItem key="variable" onClick={setVariable}>
              <MenuItemIcon>
                {value.type === "variable" ? <CheckIcon /> : <BlankIcon />}
              </MenuItemIcon>
              {l10n("FIELD_VARIABLE")}
              <MenuAccelerator accelerator="$" />
            </MenuItem>,
            <MenuItem key="property" onClick={setProperty}>
              <MenuItemIcon>
                {value.type === "property" ? <CheckIcon /> : <BlankIcon />}
              </MenuItemIcon>
              {l10n("FIELD_PROPERTY")}
              <MenuAccelerator accelerator="p" />
            </MenuItem>,
            <MenuItem key="expression" onClick={setExpression}>
              <MenuItemIcon>
                {value.type === "expression" ? <CheckIcon /> : <BlankIcon />}
              </MenuItemIcon>
              {l10n("FIELD_EXPRESSION")}
              <MenuAccelerator accelerator="e" />
            </MenuItem>,
            <MenuItem key="direction" onClick={setDirection}>
              <MenuItemIcon>
                {value.type === "direction" ? <CheckIcon /> : <BlankIcon />}
              </MenuItemIcon>
              {l10n("FIELD_DIRECTION")}
              <MenuAccelerator accelerator="d" />
            </MenuItem>,
            <MenuDivider key="divider1" />,
          ]
        : []),
      <MenuItem key="mathMenu" subMenu={mathMenu}>
        <MenuItemIcon>
          <BlankIcon />
        </MenuItemIcon>
        {l10n("EVENT_GROUP_MATH")}
      </MenuItem>,
      <MenuItem key="booleanMenu" subMenu={booleanMenu}>
        <MenuItemIcon>
          <BlankIcon />
        </MenuItemIcon>
        {l10n("FIELD_BOOLEAN")}
      </MenuItem>,
      <MenuItem key="comparisonMenu" subMenu={comparisonMenu}>
        <MenuItemIcon>
          <BlankIcon />
        </MenuItemIcon>
        {l10n("FIELD_COMPARISON")}
      </MenuItem>,
      <MenuItem key="bitwiseMenu" subMenu={bitwiseMenu}>
        <MenuItemIcon>
          <BlankIcon />
        </MenuItemIcon>
        {l10n("FIELD_BITWISE")}
      </MenuItem>,
    ],
    [
      bitwiseMenu,
      booleanMenu,
      comparisonMenu,
      isValueFn,
      mathMenu,
      setDirection,
      setExpression,
      setNumber,
      setProperty,
      setVariable,
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

  const dropdownButton = useMemo(() => {
    if (fixedType) {
      return isValueAtom(value) ? (
        <Button size="small" disabled>
          {iconLookup[value.type]}
        </Button>
      ) : null;
    }
    return isValueAtom(value) ? (
      <DropdownButton
        label={iconLookup[value.type]}
        size="small"
        showArrow={false}
        onKeyDown={onKeyDown}
      >
        {menu}
      </DropdownButton>
    ) : null;
  }, [fixedType, menu, onKeyDown, value]);

  const input = useMemo(() => {
    if (value.type === "number") {
      return (
        <ValueWrapper>
          <InputGroup>
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
                  onChange={(e: Option) => {
                    onChange({
                      type: "number",
                      value: ensureNumber(e.value, 0),
                    });
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
        <ValueWrapper>
          <InputGroup>
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
        <ValueWrapper>
          <InputGroup>
            <InputGroupPrepend>{dropdownButton}</InputGroupPrepend>
            <VariableSelect
              name={name}
              entityId={entityId}
              value={value.value}
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
    } else if (value.type === "property") {
      return (
        <ValueWrapper>
          <InputGroup>
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
        <ValueWrapper>
          <InputGroup>
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
        <ValueWrapper>
          <InputGroup>
            <InputGroupPrepend>{dropdownButton}</InputGroupPrepend>
            <Input value={l10n("FIELD_TRUE")} onKeyDown={onKeyDown} />
          </InputGroup>
        </ValueWrapper>
      );
    } else if (value.type === "false") {
      return (
        <ValueWrapper>
          <InputGroup>
            <InputGroupPrepend>{dropdownButton}</InputGroupPrepend>
            <Input value={l10n("FIELD_FALSE")} onKeyDown={onKeyDown} />
          </InputGroup>
        </ValueWrapper>
      );
    } else if (value.type === "rnd") {
      return (
        <BracketsWrapper isFunction>
          <OperatorWrapper>
            <DropdownButton
              id={name}
              label={<TextIcon>rnd</TextIcon>}
              showArrow={false}
              variant="transparent"
              size="small"
              onKeyDown={onKeyDown}
            >
              {menu}
              <MenuDivider />
              <MenuItem
                onClick={() => {
                  onChange(value.valueA);
                  focus();
                }}
              >
                <MenuItemIcon>
                  <BlankIcon />
                </MenuItemIcon>
                {l10n("FIELD_REMOVE")}
              </MenuItem>
            </DropdownButton>
          </OperatorWrapper>
          <BracketsWrapper>
            <ValueSelect
              name={`${name}_valueA`}
              entityId={entityId}
              value={value.valueA}
              onChange={(newValue) => {
                if (!newValue || newValue.type === "number") {
                  onChange({
                    ...value,
                    valueA: newValue,
                  });
                }
              }}
              innerValue
              fixedType
            />
            ,
            <ValueSelect
              name={`${name}_valueB`}
              entityId={entityId}
              value={value.valueB}
              onChange={(newValue) => {
                if (!newValue || newValue.type === "number") {
                  onChange({
                    ...value,
                    valueB: newValue,
                  });
                }
              }}
              innerValue
              fixedType
            />
          </BracketsWrapper>
        </BracketsWrapper>
      );
    } else if (value.type === "min") {
      return (
        <BracketsWrapper isFunction>
          <OperatorWrapper>
            <DropdownButton
              id={name}
              label={<TextIcon>min</TextIcon>}
              showArrow={false}
              variant="transparent"
              size="small"
              onKeyDown={onKeyDown}
            >
              {menu}
              <MenuDivider />
              <MenuItem
                onClick={() => {
                  onChange(value.valueA);
                  focus();
                }}
              >
                <MenuItemIcon>
                  <BlankIcon />
                </MenuItemIcon>
                {l10n("FIELD_REMOVE")}
              </MenuItem>
            </DropdownButton>
          </OperatorWrapper>
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
    } else if (value.type === "max") {
      return (
        <BracketsWrapper isFunction>
          <OperatorWrapper>
            <DropdownButton
              id={name}
              label={<TextIcon>max</TextIcon>}
              showArrow={false}
              variant="transparent"
              size="small"
              onKeyDown={onKeyDown}
            >
              {menu}
              <MenuDivider />
              <MenuItem
                onClick={() => {
                  onChange(value.valueA);
                  focus();
                }}
              >
                <MenuItemIcon>
                  <BlankIcon />
                </MenuItemIcon>
                {l10n("FIELD_REMOVE")}
              </MenuItem>
            </DropdownButton>
          </OperatorWrapper>
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
    } else if (value.type === "not") {
      return (
        <BracketsWrapper isFunction>
          <OperatorWrapper>
            <DropdownButton
              id={name}
              label={<NotIcon />}
              showArrow={false}
              variant="transparent"
              size="small"
              onKeyDown={onKeyDown}
            >
              {menu}
              <MenuDivider />
              <MenuItem
                onClick={() => {
                  onChange(value.value);
                  focus();
                }}
              >
                <MenuItemIcon>
                  <BlankIcon />
                </MenuItemIcon>
                {l10n("FIELD_REMOVE")}
              </MenuItem>
            </DropdownButton>
          </OperatorWrapper>
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
    } else if (value.type === "bNOT") {
      return (
        <BracketsWrapper isFunction>
          <OperatorWrapper>
            <DropdownButton
              id={name}
              label={iconLookup[value.type]}
              showArrow={false}
              variant="transparent"
              size="small"
              onKeyDown={onKeyDown}
            >
              {menu}
              <MenuDivider />
              <MenuItem
                onClick={() => {
                  onChange(value.value);
                  focus();
                }}
              >
                <MenuItemIcon>
                  <BlankIcon />
                </MenuItemIcon>
                {l10n("FIELD_REMOVE")}
              </MenuItem>
            </DropdownButton>
          </OperatorWrapper>
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
      return (
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
          <OperatorWrapper>
            <DropdownButton
              id={name}
              label={iconLookup[value.type]}
              showArrow={false}
              variant="transparent"
              size="small"
              onKeyDown={onKeyDown}
            >
              {menu}
              <MenuDivider />
              <MenuItem
                onClick={() => {
                  onChange(value.valueA);
                  focus();
                }}
              >
                <MenuItemIcon>
                  <BlankIcon />
                </MenuItemIcon>
                {l10n("FIELD_REMOVE")}
              </MenuItem>
            </DropdownButton>
          </OperatorWrapper>
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
    }
    return null;
  }, [
    dropdownButton,
    entityId,
    focus,
    innerValue,
    inputOverride,
    // isHovered,
    max,
    menu,
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
