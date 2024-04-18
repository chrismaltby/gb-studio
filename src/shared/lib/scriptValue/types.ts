import { ensureTypeGenerator } from "shared/types";

export const valueAtomTypes = [
  "number",
  "direction",
  "variable",
  "indirect",
  "property",
  "expression",
  "true",
  "false",
] as const;
export type ValueAtomType = typeof valueAtomTypes[number];

export const valueOperatorTypes = [
  "add",
  "sub",
  "mul",
  "div",
  "mod",
  "min",
  "max",
  "eq",
  "ne",
  "gt",
  "gte",
  "lt",
  "lte",
  "and",
  "or",
  "atan2",
  // Bitwise
  "shl",
  "shr",
  "bAND",
  "bOR",
  "bXOR",
] as const;
export type ValueOperatorType = typeof valueOperatorTypes[number];

export const valueUnaryOperatorTypes = [
  "not",
  "isqrt",
  "abs",
  // Bitwise
  "bNOT",
] as const;
export type ValueUnaryOperatorType = typeof valueUnaryOperatorTypes[number];

export type ValueType =
  | ValueAtomType
  | ValueOperatorType
  | ValueUnaryOperatorType;

export const isValueAtomType = (type: unknown): type is ValueAtomType =>
  valueAtomTypes.includes(type as ValueAtomType);

export const isValueOperatorType = (type: unknown): type is ValueOperatorType =>
  valueOperatorTypes.includes(type as ValueOperatorType);

export const isValueUnaryOperatorType = (
  type: unknown
): type is ValueUnaryOperatorType =>
  valueUnaryOperatorTypes.includes(type as ValueUnaryOperatorType);

const infixOperators = [
  "add",
  "sub",
  "mul",
  "div",
  "mod",
  "eq",
  "ne",
  "gt",
  "gte",
  "lt",
  "lte",
  "and",
  "or",
  "shl",
  "shr",
  "bAND",
  "bOR",
  "bXOR",
];
export const isInfix = (type: ValueOperatorType) =>
  infixOperators.includes(type);

export type RPNUnaryOperation = {
  type: ValueUnaryOperatorType;
  value: ScriptValue;
};

export type RPNOperation = {
  type: ValueOperatorType;
  valueA: ScriptValue;
  valueB: ScriptValue;
};

export type RPNRandomOperation = {
  type: "rnd";
  valueA: {
    type: "number";
    value: number;
  };
  valueB: {
    type: "number";
    value: number;
  };
};

export type ScriptValueAtom =
  | {
      type: "number";
      value: number;
    }
  | {
      type: "variable";
      value: string;
    }
  | {
      type: "direction";
      value: string;
    }
  | {
      type: "indirect";
      value: string;
    }
  | {
      type: "property";
      target: string;
      property: string;
    }
  | {
      type: "expression";
      value: string;
    }
  | {
      type: "true";
    }
  | {
      type: "false";
    };

export type ScriptValue =
  | RPNOperation
  | RPNUnaryOperation
  | RPNRandomOperation
  | ScriptValueAtom;

export type ValueFunctionMenuItem = {
  value: ValueOperatorType;
  label: string;
  symbol: string;
};

const validProperties = [
  "xpos",
  "ypos",
  "pxpos",
  "pypos",
  "direction",
  "frame",
];

export const isScriptValue = (value: unknown): value is ScriptValue => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const scriptValue = value as ScriptValue;
  // Is a number
  if (scriptValue.type === "number" && typeof scriptValue.value === "number") {
    return true;
  }
  // Is bool
  if (scriptValue.type === "true" || scriptValue.type === "false") {
    return true;
  }
  if (
    scriptValue.type === "variable" &&
    typeof scriptValue.value === "string"
  ) {
    return true;
  }
  if (
    scriptValue.type === "property" &&
    typeof scriptValue.target === "string" &&
    typeof scriptValue.property === "string" &&
    validProperties.includes(scriptValue.property)
  ) {
    return true;
  }
  if (
    scriptValue.type === "expression" &&
    typeof scriptValue.value === "string"
  ) {
    return true;
  }
  if (
    scriptValue.type === "direction" &&
    typeof scriptValue.value === "string"
  ) {
    return true;
  }
  if (
    isValueOperation(scriptValue) &&
    (isScriptValue(scriptValue.valueA) || !scriptValue.valueA) &&
    (isScriptValue(scriptValue.valueB) || !scriptValue.valueB)
  ) {
    return true;
  }
  if (
    isUnaryOperation(scriptValue) &&
    (isScriptValue(scriptValue.value) || !scriptValue.value)
  ) {
    return true;
  }
  if (
    scriptValue.type === "rnd" &&
    (isScriptValue(scriptValue.valueA) || !scriptValue.valueA) &&
    (isScriptValue(scriptValue.valueB) || !scriptValue.valueB)
  ) {
    return true;
  }

  return false;
};

export type ScriptValueFunction = ScriptValue & { type: ValueOperatorType };
export type ScriptValueUnaryOperation = ScriptValue & {
  type: ValueUnaryOperatorType;
};

export const isUnaryOperation = (
  value?: ScriptValue
): value is ScriptValueUnaryOperation => {
  return (
    !!value &&
    valueUnaryOperatorTypes.includes(
      value.type as unknown as ValueUnaryOperatorType
    )
  );
};

export const isValueOperation = (
  value?: ScriptValue
): value is ScriptValueFunction => {
  return (
    !!value &&
    valueOperatorTypes.includes(value.type as unknown as ValueOperatorType)
  );
};

export const isValueAtom = (value?: ScriptValue): value is ScriptValueAtom => {
  return (
    !!value && valueAtomTypes.includes(value.type as unknown as ValueAtomType)
  );
};

export const isValueNumber = (
  value: unknown
): value is {
  type: "number";
  value: number;
} => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const scriptValue = value as ScriptValue;
  // Is a number
  if (scriptValue.type === "number" && typeof scriptValue.value === "number") {
    return true;
  }
  return false;
};

export type PrecompiledValueFetch = {
  local: string;
  value:
    | {
        type: "property";
        target: string;
        property: string;
      }
    | {
        type: "expression";
        value: string;
      }
    | {
        type: "rnd";
        valueA?: {
          type: "number";
          value: number;
        };
        valueB?: {
          type: "number";
          value: number;
        };
      };
};

export type PrecompiledValueRPNOperation =
  | {
      type: "number";
      value: number;
    }
  | {
      type: "variable";
      value: string;
    }
  | {
      type: "direction";
      value: string;
    }
  | {
      type: "indirect";
      value: string;
    }
  | {
      type: "local";
      value: string;
    }
  | {
      type: ValueOperatorType | ValueUnaryOperatorType;
    };

export const ensureScriptValue = ensureTypeGenerator(isScriptValue);
