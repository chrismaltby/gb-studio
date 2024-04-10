import DirectionPicker from "components/forms/DirectionPicker";
import { PropertySelect } from "components/forms/PropertySelect";
import { VariableSelect } from "components/forms/VariableSelect";
import {
  isValueAtom,
  isValueOperation,
  ScriptValue,
  ValueAtom,
  ValueFunction,
} from "shared/lib/scriptValue/types";
import React, { useCallback, useContext, useMemo, useState } from "react";
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
  MinusIcon,
  NumberIcon,
  PlusIcon,
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
import { castEventToInt } from "renderer/lib/helpers/castEventValue";
import l10n from "shared/lib/lang/l10n";
import L10NText from "ui/form/L10NText";

type ValueFunctionMenuItem = {
  value: ValueFunction;
  label: React.ReactNode;
  symbol?: string;
};

const TextIcon = styled.div`
  line-height: 0;
  font-weight: bold;
  font-style: italic;
`;

const operatorIconLookup: Partial<Record<ValueFunction, JSX.Element>> = {
  add: <PlusIcon />,
  sub: <MinusIcon />,
  mul: <CrossIcon />,
  div: <DivideIcon />,
  eq: <TextIcon>==</TextIcon>,
  ne: <TextIcon>!=</TextIcon>,
  gt: <TextIcon>&gt;</TextIcon>,
  gte: <TextIcon>&gt;=</TextIcon>,
  lt: <TextIcon>&lt;</TextIcon>,
  lte: <TextIcon>&lt;=</TextIcon>,
};

const atomIconLookup: Record<ValueAtom, JSX.Element> = {
  number: <NumberIcon />,
  direction: <CompassIcon />,
  variable: <VariableIcon />,
  indirect: <VariableIcon />,
  expression: <ExpressionIcon />,
  property: <ActorIcon />,
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
    symbol: "!",
  },
  {
    value: "gt",
    label: <L10NText l10nKey="FIELD_GT" />,
    symbol: ">",
  },
  {
    value: "gte",
    label: <L10NText l10nKey="FIELD_GTE" />,
  },
  {
    value: "lt",
    label: <L10NText l10nKey="FIELD_LT" />,
    symbol: "<",
  },
  {
    value: "lte",
    label: <L10NText l10nKey="FIELD_LTE" />,
  },
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

const OperatorWrapper = styled.div`
  min-width: 24px;
  flex-shrink: 0;
  flex-grow: 0;
`;

interface ValueWrapperProps {
  hover?: boolean;
}

const ValueWrapper = styled.div<ValueWrapperProps>`
  display: flex;
  flex-grow: 1;
  align-items: center;
  min-width: 98px;
  flex-basis: 130px;
`;

const FunctionWrapper = styled.div<ValueWrapperProps>`
  display: flex;
  align-items: center;
  border-radius: 8px;
  flex-grow: 1;
  ${(props) =>
    props.hover
      ? css`
          background: ${(props) => props.theme.colors.brackets.hoverBackground};
        `
      : ""}
`;

const BracketsWrapper = styled.div<ValueWrapperProps>`
  display: flex;
  align-items: center;
  padding: 0px 5px;
  border-radius: 8px;
  flex-wrap: wrap;
  flex-grow: 1;

  > * {
    margin: 2.5px;
  }

  border-left: 2px solid ${(props) => props.theme.colors.brackets.color};
  border-right: 2px solid ${(props) => props.theme.colors.brackets.color};

  ${(props) =>
    props.hover
      ? css`
          background: ${(props) => props.theme.colors.brackets.hoverBackground};
        `
      : ""}
`;

const Wrapper = styled.div`
  display: flex;

  > ${FunctionWrapper}:first-child {
    margin-top: -3px;
  }
  > ${BracketsWrapper}:first-child {
    margin-top: -3px;
  }
`;
interface ValueSelectProps {
  name: string;
  entityId: string;
  value?: ScriptValue;
  onChange: (newValue: ScriptValue | undefined) => void;
  innerValue?: boolean;
  fixedType?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
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
}: ValueSelectProps) => {
  const context = useContext(ScriptEditorContext);
  const editorType = useSelector((state: RootState) => state.editor.type);

  const [isHovered, setIsHovered] = useState(false);

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

  const setValueFunction = useCallback(
    (type: ValueFunction) => {
      if (isValueOperation(value) || value.type === "rnd") {
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
          valueB: undefined,
        });
        focusSecondChild();
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
    (e: React.KeyboardEvent<HTMLButtonElement | HTMLInputElement>): boolean => {
      e.persist();
      if (e.metaKey || e.ctrlKey) {
        return false;
      }
      if (e.key === "n") {
        setNumber();
      } else if (e.key === "$") {
        setVariable();
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
          (e.currentTarget.value.trim().length > 0 && !hasSelection)
        ) {
          setValueFunction("sub");
        }
      } else if (e.key === "*") {
        setValueFunction("mul");
      } else if (e.key === "/") {
        setValueFunction("div");
      } else if (e.key === "m") {
        setValueFunction("min");
      } else if (e.key === "M") {
        setValueFunction("max");
      } else if (e.key === "=") {
        setValueFunction("eq");
      } else if (e.key === "!") {
        setValueFunction("ne");
      } else if (e.key === ">") {
        setValueFunction("gt");
      } else if (e.key === "<") {
        setValueFunction("lt");
      } else if (e.key === "r") {
        setRandom();
      } else {
        return false;
      }
      return true;
    },
    [setNumber, setRandom, setValueFunction, setVariable]
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
            <MenuItem
              key="property"
              onClick={() => {
                onChange({
                  type: "property",
                  target:
                    context.type === "entity" && editorType === "actor"
                      ? "$self$"
                      : "player",
                  property: "xpos",
                });
              }}
            >
              <MenuItemIcon>
                {value.type === "property" ? <CheckIcon /> : <BlankIcon />}
              </MenuItemIcon>
              {l10n("FIELD_PROPERTY")}
            </MenuItem>,
            <MenuItem
              key="expression"
              onClick={() => {
                onChange({
                  type: "expression",
                  value: "",
                });
              }}
            >
              <MenuItemIcon>
                {value.type === "expression" ? <CheckIcon /> : <BlankIcon />}
              </MenuItemIcon>
              {l10n("FIELD_EXPRESSION")}
            </MenuItem>,
            <MenuItem
            key="direction"
            onClick={() => {
              onChange({
                type: "direction",
                value: "left",
              });
            }}
          >
            <MenuItemIcon>
              {value.type === "direction" ? <CheckIcon /> : <BlankIcon />}
            </MenuItemIcon>
            {l10n("FIELD_DIRECTION")}
          </MenuItem>,            
            <MenuDivider key="divider" />,
          ]
        : []),
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
      <MenuDivider key="div3" />,

      <MenuItem key="rnd" onClick={setRandom}>
        <MenuItemIcon>
          {value.type === "rnd" ? <CheckIcon /> : <BlankIcon />}
        </MenuItemIcon>
        {l10n("FIELD_RANDOM")}
        <MenuAccelerator accelerator="r" />
      </MenuItem>,
    ],
    [
      context.type,
      editorType,
      isValueFn,
      onChange,
      setNumber,
      setRandom,
      setValueFunction,
      setVariable,
      value.type,
    ]
  );

  const dropdownButton = useMemo(() => {
    if (fixedType) {
      return isValueAtom(value) ? (
        <Button size="small" disabled>
          {atomIconLookup[value.type]}
        </Button>
      ) : null;
    }
    return isValueAtom(value) ? (
      <DropdownButton
        label={atomIconLookup[value.type]}
        size="small"
        showArrow={false}
        onKeyDown={onKeyDown}
      >
        {menu}
      </DropdownButton>
    ) : null;
  }, [fixedType, menu, onKeyDown, value]);

  let input: JSX.Element | null = null;
  if (value.type === "number") {
    input = (
      <ValueWrapper>
        <InputGroup>
          <InputGroupPrepend>{dropdownButton}</InputGroupPrepend>
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
        </InputGroup>
      </ValueWrapper>
    );
  } else if (value.type === "direction") {
    input = (
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
    input = (
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
    input = (
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
    input = (
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
  } else if (value.type === "rnd") {
    input = (
      <FunctionWrapper
        hover={isHovered}
        onMouseOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsHovered(true);
        }}
        onMouseOut={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsHovered(false);
        }}
      >
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
        <BracketsWrapper
          hover={isHovered}
          onMouseOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsHovered(true);
          }}
          onMouseOut={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsHovered(false);
          }}
        >
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
      </FunctionWrapper>
    );
  } else if (value.type === "min") {
    input = (
      <FunctionWrapper
        hover={isHovered}
        onMouseOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsHovered(true);
        }}
        onMouseOut={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsHovered(false);
        }}
      >
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
        <BracketsWrapper
          hover={isHovered}
          onMouseOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsHovered(true);
          }}
          onMouseOut={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsHovered(false);
          }}
        >
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
      </FunctionWrapper>
    );
  } else if (value.type === "max") {
    input = (
      <FunctionWrapper
        hover={isHovered}
        onMouseOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsHovered(true);
        }}
        onMouseOut={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsHovered(false);
        }}
      >
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
        <BracketsWrapper
          hover={isHovered}
          onMouseOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsHovered(true);
          }}
          onMouseOut={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsHovered(false);
          }}
        >
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
      </FunctionWrapper>
    );
  } else if (isValueOperation(value)) {
    input = (
      <BracketsWrapper
        hover={isHovered}
        onMouseOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsHovered(true);
        }}
        onMouseOut={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsHovered(false);
        }}
      >
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
            label={operatorIconLookup[value.type]}
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

  if (innerValue) {
    return input;
  }

  return <Wrapper>{input}</Wrapper>;
};

export default ValueSelect;
