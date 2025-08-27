import type { ScriptBuilderFunctionArg } from "lib/compiler/scriptBuilder";
import { ensureTypeGenerator } from "shared/types";

export const valueAtomTypes = [
  "number",
  "numberSymbol",
  "direction",
  "variable",
  "indirect",
  "constant",
  "property",
  "expression",
  "engineField",
  "true",
  "false",
] as const;
export type ValueAtomType = (typeof valueAtomTypes)[number];

export const constValueAtomTypes = ["number", "constant"] as const;
export type ConstValueAtomType = (typeof constValueAtomTypes)[number];

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
export type ValueOperatorType = (typeof valueOperatorTypes)[number];

export const valueUnaryOperatorTypes = [
  "rnd",
  "not",
  "isqrt",
  "abs",
  // Bitwise
  "bNOT",
] as const;
export type ValueUnaryOperatorType = (typeof valueUnaryOperatorTypes)[number];

export type ValueType =
  | ValueAtomType
  | ValueOperatorType
  | ValueUnaryOperatorType;

export const isValueAtomType = (type: unknown): type is ValueAtomType =>
  valueAtomTypes.includes(type as ValueAtomType);

export const isValueOperatorType = (type: unknown): type is ValueOperatorType =>
  valueOperatorTypes.includes(type as ValueOperatorType);

export const isValueUnaryOperatorType = (
  type: unknown,
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

export type ScriptValueAtom =
  | {
      type: "number";
      value: number;
    }
  | {
      type: "numberSymbol";
      value: string;
    }
  | {
      type: "variable";
      value: string;
    }
  | {
      type: "constant";
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
      type: "engineField";
      value: string;
    }
  | {
      type: "true";
    }
  | {
      type: "false";
    };

export type ConstScriptValueAtom =
  | {
      type: "number";
      value: number;
    }
  | {
      type: "constant";
      value: string;
    };

export type ScriptValue = RPNOperation | RPNUnaryOperation | ScriptValueAtom;

export type ConstScriptValue = ConstScriptValueAtom;

export type ValueFunctionMenuItem = {
  value: ValueOperatorType;
  label: string;
  symbol: string;
};

type OptimisedScriptValueAtom = Exclude<
  ScriptValueAtom,
  { type: "expression" }
>;

export type OptimisedScriptValue =
  | RPNOperationWithOptimisedValues
  | RPNUnaryOperationWithOptimisedValue
  | OptimisedScriptValueAtom;

type RPNOperationWithOptimisedValues = {
  type: ValueOperatorType;
  valueA: OptimisedScriptValue;
  valueB: OptimisedScriptValue;
};

type RPNUnaryOperationWithOptimisedValue = {
  type: ValueUnaryOperatorType;
  value: OptimisedScriptValue;
};

const validProperties = [
  "xpos",
  "ypos",
  "pxpos",
  "pypos",
  "direction",
  "frame",
  "xdeadzone",
  "ydeadzone",
  "xoffset",
  "yoffset",
];

export const isScriptValue = (value: unknown): value is ScriptValue => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const scriptValue = value as ScriptValue;

  // Is a number
  if (scriptValue.type === "number") {
    return typeof scriptValue.value === "number";
  }
  // Is a number symbol
  if (scriptValue.type === "numberSymbol") {
    return typeof scriptValue.value === "string";
  }
  // Is bool
  if (scriptValue.type === "true" || scriptValue.type === "false") {
    return true;
  }
  // Is Variable
  if (scriptValue.type === "variable") {
    return typeof scriptValue.value === "string";
  }
  // Is Constant
  if (scriptValue.type === "constant") {
    return typeof scriptValue.value === "string";
  }
  // Is Property
  if (scriptValue.type === "property") {
    return (
      typeof scriptValue.target === "string" &&
      typeof scriptValue.property === "string" &&
      validProperties.includes(scriptValue.property)
    );
  }
  // Is Expression
  if (scriptValue.type === "expression") {
    return typeof scriptValue.value === "string";
  }
  // Is Engine Field
  if (scriptValue.type === "engineField") {
    return typeof scriptValue.value === "string";
  }
  // Is Direction
  if (scriptValue.type === "direction") {
    return typeof scriptValue.value === "string";
  }
  if (isValueOperation(scriptValue)) {
    return (
      (isScriptValue(scriptValue.valueA) || !scriptValue.valueA) &&
      (isScriptValue(scriptValue.valueB) || !scriptValue.valueB)
    );
  }
  if (isUnaryOperation(scriptValue)) {
    return isScriptValue(scriptValue.value) || !scriptValue.value;
  }
  if (scriptValue.type === "indirect") {
    return true;
  }

  return false;
};

export const isConstScriptValue = (
  value: unknown,
): value is ConstScriptValue => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const scriptValue = value as ConstScriptValue;
  // Is a number
  if (scriptValue.type === "number" && typeof scriptValue.value === "number") {
    return true;
  }
  // Is a constant
  if (
    scriptValue.type === "constant" &&
    typeof scriptValue.value === "string"
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
  value?: ScriptValue,
): value is ScriptValueUnaryOperation => {
  return (
    !!value &&
    valueUnaryOperatorTypes.includes(
      value.type as unknown as ValueUnaryOperatorType,
    )
  );
};

export const isValueOperation = (
  value?: ScriptValue,
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
  value: unknown,
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
        type: "actorPosition";
        target: string | ScriptBuilderFunctionArg;
      }
    | {
        type: "actorDirection";
        target: string | ScriptBuilderFunctionArg;
      }
    | {
        type: "actorFrame";
        target: string | ScriptBuilderFunctionArg;
      }
    | {
        type: "engineField";
        value: string;
      };
};

export type PrecompiledValueRPNOperation =
  | {
      type: "number";
      value: number;
    }
  | {
      type: "numberSymbol";
      value: string;
    }
  | {
      type: "constant";
      value: string;
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
      offset?: number;
    }
  | {
      type: "memI16";
      value: string;
    }
  | {
      type: "memU8";
      value: string;
    }
  | {
      type: "memI8";
      value: string;
    }
  | {
      type: ValueOperatorType | ValueUnaryOperatorType;
    };

export const ensureScriptValue = ensureTypeGenerator(isScriptValue);
