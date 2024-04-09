export type RPNOperation =
  | {
      type: "add";
      valueA?: ScriptValue;
      valueB?: ScriptValue;
    }
  | {
      type: "sub";
      valueA?: ScriptValue;
      valueB?: ScriptValue;
    }
  | {
      type: "mul";
      valueA?: ScriptValue;
      valueB?: ScriptValue;
    }
  | {
      type: "div";
      valueA?: ScriptValue;
      valueB?: ScriptValue;
    }
  | {
      type: "eq";
      valueA?: ScriptValue;
      valueB?: ScriptValue;
    }
  | {
      type: "ne";
      valueA?: ScriptValue;
      valueB?: ScriptValue;
    }
  | {
      type: "gt";
      valueA?: ScriptValue;
      valueB?: ScriptValue;
    }
  | {
      type: "gte";
      valueA?: ScriptValue;
      valueB?: ScriptValue;
    }
  | {
      type: "lt";
      valueA?: ScriptValue;
      valueB?: ScriptValue;
    }
  | {
      type: "lte";
      valueA?: ScriptValue;
      valueB?: ScriptValue;
    }
  | {
      type: "min";
      valueA?: ScriptValue;
      valueB?: ScriptValue;
    }
  | {
      type: "max";
      valueA?: ScriptValue;
      valueB?: ScriptValue;
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
    };

export type ScriptValue =
  | RPNOperation
  | ScriptValueAtom
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

export const valueFunctions = [
  "add",
  "sub",
  "mul",
  "div",
  "min",
  "max",
  "eq",
  "ne",
  "gt",
  "gte",
  "lt",
  "lte",
] as const;
export type ValueFunction = typeof valueFunctions[number];

export const valueAtoms = [
  "number",
  "direction",
  "variable",
  "indirect",
  "property",
  "expression",
] as const;
export type ValueAtom = typeof valueAtoms[number];

export type ValueFunctionMenuItem = {
  value: ValueFunction;
  label: string;
  symbol: string;
};

export const isScriptValue = (value: unknown): value is ScriptValue => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const scriptValue = value as ScriptValue;
  // Is a number
  if (scriptValue.type === "number" && typeof scriptValue.value === "number") {
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
    typeof scriptValue.property === "string"
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
    scriptValue.type === "rnd" &&
    (isScriptValue(scriptValue.valueA) || !scriptValue.valueA) &&
    (isScriptValue(scriptValue.valueB) || !scriptValue.valueB)
  ) {
    return true;
  }

  return false;
};

export type ScriptValueFunction = ScriptValue & { type: ValueFunction };

export const isValueOperation = (
  value?: ScriptValue
): value is ScriptValueFunction => {
  return (
    !!value && valueFunctions.includes(value.type as unknown as ValueFunction)
  );
};

export const isValueAtom = (value?: ScriptValue): value is ScriptValueAtom => {
  return !!value && valueAtoms.includes(value.type as unknown as ValueAtom);
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
      type: "add";
    }
  | {
      type: "sub";
    }
  | {
      type: "mul";
    }
  | {
      type: "div";
    }
  | {
      type: "eq";
    }
  | {
      type: "ne";
    }
  | {
      type: "gt";
    }
  | {
      type: "gte";
    }
  | {
      type: "lt";
    }
  | {
      type: "lte";
    }
  | {
      type: "min";
    }
  | {
      type: "max";
    };
