import { wrap8Bit } from "shared/lib/helpers/8bit";
import { assertUnreachable } from "./format";
import tokenize from "shared/lib/rpn/tokenizer";
import shuntingYard from "shared/lib/rpn/shuntingYard";
import {
  PrecompiledValueRPNOperation,
  PrecompiledValueFetch,
  isValueOperation,
  ScriptValue,
  isUnaryOperation,
  ValueOperatorType,
  ValueUnaryOperatorType,
  isValueUnaryOperatorType,
} from "./types";
import { OperatorSymbol } from "shared/lib/rpn/types";

const boolToInt = (val: boolean) => (val ? 1 : 0);
const zero = {
  type: "number",
  value: 0,
} as const;

export const optimiseScriptValue = (input: ScriptValue): ScriptValue => {
  if (isValueOperation(input)) {
    const optimisedA = input.valueA ? optimiseScriptValue(input.valueA) : zero;
    const optimisedB = input.valueB ? optimiseScriptValue(input.valueB) : zero;

    if (optimisedA?.type === "number" && optimisedB?.type === "number") {
      // Can perform constant folding as both inputs are numbers
      if (input.type === "add") {
        return {
          type: "number",
          value: Math.floor(optimisedA.value + optimisedB.value),
        };
      } else if (input.type === "sub") {
        return {
          type: "number",
          value: Math.floor(optimisedA.value - optimisedB.value),
        };
      } else if (input.type === "mul") {
        return {
          type: "number",
          value: Math.floor(optimisedA.value * optimisedB.value),
        };
      } else if (input.type === "div") {
        return {
          type: "number",
          value: Math.floor(optimisedA.value / optimisedB.value),
        };
      } else if (input.type === "mod") {
        return {
          type: "number",
          value: Math.floor(optimisedA.value % optimisedB.value),
        };
      } else if (input.type === "gt") {
        return {
          type: "number",
          value: boolToInt(optimisedA.value > optimisedB.value),
        };
      } else if (input.type === "gte") {
        return {
          type: "number",
          value: boolToInt(optimisedA.value >= optimisedB.value),
        };
      } else if (input.type === "lt") {
        return {
          type: "number",
          value: boolToInt(optimisedA.value < optimisedB.value),
        };
      } else if (input.type === "lte") {
        return {
          type: "number",
          value: boolToInt(optimisedA.value <= optimisedB.value),
        };
      } else if (input.type === "eq") {
        return {
          type: "number",
          value: boolToInt(optimisedA.value === optimisedB.value),
        };
      } else if (input.type === "ne") {
        return {
          type: "number",
          value: boolToInt(optimisedA.value !== optimisedB.value),
        };
      } else if (input.type === "min") {
        return {
          type: "number",
          value: Math.min(optimisedA.value, optimisedB.value),
        };
      } else if (input.type === "max") {
        return {
          type: "number",
          value: Math.max(optimisedA.value, optimisedB.value),
        };
      } else if (input.type === "and") {
        return {
          type: "number",
          value: optimisedA.value && optimisedB.value,
        };
      } else if (input.type === "or") {
        return {
          type: "number",
          value: optimisedA.value || optimisedB.value,
        };
      } else if (input.type === "shl") {
        return {
          type: "number",
          value: optimisedA.value << optimisedB.value,
        };
      } else if (input.type === "shr") {
        return {
          type: "number",
          value: optimisedA.value >> optimisedB.value,
        };
      } else if (input.type === "bAND") {
        return {
          type: "number",
          value: optimisedA.value & optimisedB.value,
        };
      } else if (input.type === "bOR") {
        return {
          type: "number",
          value: optimisedA.value | optimisedB.value,
        };
      } else if (input.type === "bXOR") {
        return {
          type: "number",
          value: optimisedA.value ^ optimisedB.value,
        };
      } else if (input.type === "atan2") {
        return {
          type: "number",
          value: Math.floor(
            wrap8Bit(
              Math.atan2(optimisedA.value, optimisedB.value) * (128 / Math.PI) +
                64
            )
          ),
        };
      }
      /* istanbul ignore next: unreachable */
      assertUnreachable(input.type);
    }

    return {
      ...input,
      valueA: optimisedA,
      valueB: optimisedB,
    };
  }
  if (isUnaryOperation(input)) {
    const type = input.type;
    const optimisedValue = input.value
      ? optimiseScriptValue(input.value)
      : zero;
    if (optimisedValue?.type === "number") {
      if (type === "not") {
        return {
          type: "number",
          value: boolToInt(!optimisedValue.value),
        };
      } else if (type === "abs") {
        return {
          type: "number",
          value: Math.floor(Math.abs(optimisedValue.value)),
        };
      } else if (type === "isqrt") {
        return {
          type: "number",
          value: Math.floor(Math.sqrt(optimisedValue.value)),
        };
      } else if (type === "bNOT") {
        return {
          type: "number",
          value: ~optimisedValue.value,
        };
      } else if (type === "rnd") {
        return {
          type: "rnd",
          value: {
            type: "number",
            value: optimisedValue.value,
          },
        };
      }
      /* istanbul ignore next: unreachable */
      assertUnreachable(type);
    }
    return {
      ...input,
      value: optimisedValue,
    };
  } else if (input.type === "expression") {
    return optimiseScriptValue(expressionToScriptValue(input.value));
  }
  return input;
};

export const expressionToScriptValue = (expression: string): ScriptValue => {
  const tokens = tokenize(expression);
  const rpnTokens = shuntingYard(tokens);

  const stack: ScriptValue[] = [];

  function mapOperator(
    operator: OperatorSymbol
  ): ValueOperatorType | ValueUnaryOperatorType {
    const operatorMap: Record<
      OperatorSymbol,
      ValueOperatorType | ValueUnaryOperatorType
    > = {
      "/": "div",
      "*": "mul",
      "+": "add",
      "-": "sub",
      "%": "mod",
      "!": "not",
      "&": "bAND",
      "|": "bOR",
      "^": "bXOR",
      "~": "bNOT",
      "==": "eq",
      "!=": "ne",
      "<": "lt",
      "<=": "lte",
      ">": "gt",
      ">=": "gte",
      "&&": "and",
      "||": "or",
      "<<": "shl",
      ">>": "shr",
    };

    const scriptValueOperator = operatorMap[operator];

    /* istanbul ignore else: unreachable else branch */
    if (scriptValueOperator) {
      return scriptValueOperator;
    } else {
      assertUnreachable(scriptValueOperator);
      return "eq";
    }
  }

  for (const operation of rpnTokens) {
    if (operation.type === "VAR") {
      stack.push({
        type: "variable",
        value: operation.symbol.replace(/\$/g, "").replace(/^0/g, ""),
      });
    } else if (operation.type === "VAL") {
      stack.push({
        type: "number",
        value: operation.value,
      });
    } else if (operation.type === "OP") {
      const scriptValueOperator = mapOperator(operation.operator);
      if (isValueUnaryOperatorType(scriptValueOperator)) {
        const value = stack.pop();
        if (value) {
          stack.push({
            type: scriptValueOperator,
            value,
          });
        }
      } else {
        const valueB = stack.pop();
        const valueA = stack.pop();
        if (valueA && valueB) {
          stack.push({
            type: scriptValueOperator,
            valueA,
            valueB,
          });
        }
      }
    } else if (operation.type === "FUN") {
      if (operation.function === "min") {
        const valueB = stack.pop();
        const valueA = stack.pop();
        if (valueA && valueB) {
          stack.push({
            type: "min",
            valueA,
            valueB,
          });
        }
      } else if (operation.function === "max") {
        const valueB = stack.pop();
        const valueA = stack.pop();
        if (valueA && valueB) {
          stack.push({
            type: "max",
            valueA,
            valueB,
          });
        }
      } else if (operation.function === "abs") {
        const value = stack.pop();
        if (value) {
          stack.push({
            type: "abs",
            value,
          });
        }
      } else if (operation.function === "rnd") {
        const value = stack.pop();
        if (value) {
          stack.push({
            type: "rnd",
            value,
          });
        }
      } else if (operation.function === "isqrt") {
        const value = stack.pop();
        if (value) {
          stack.push({
            type: "isqrt",
            value,
          });
        }
      } else if (operation.function === "atan2") {
        const valueB = stack.pop();
        const valueA = stack.pop();
        if (valueA && valueB) {
          stack.push({
            type: "atan2",
            valueA,
            valueB,
          });
        }
      } else {
        /* istanbul ignore next: unreachable */
        assertUnreachable(operation.function);
      }
    } else {
      /* istanbul ignore next: unreachable */
      assertUnreachable(operation);
    }
  }

  return stack.length === 1 ? stack[0] : zero;
};

export const walkScriptValue = (
  input: ScriptValue,
  fn: (val: ScriptValue) => void
): void => {
  fn(input);
  if ("valueA" in input && input.valueA) {
    walkScriptValue(input.valueA, fn);
  }
  if ("valueB" in input && input.valueB) {
    walkScriptValue(input.valueB, fn);
  }
  if ("value" in input && input.value && isUnaryOperation(input)) {
    walkScriptValue(input.value, fn);
  }
};

// recursively search script value for matching node, stop iterating on first match
export const someInScriptValue = (
  input: ScriptValue,
  fn: (val: ScriptValue) => boolean
): boolean => {
  const stack: ScriptValue[] = [input];

  while (stack.length > 0) {
    const currentNode = stack.pop();
    if (!currentNode) continue;

    if (fn(currentNode)) {
      return true;
    }

    if ("valueA" in currentNode && "valueB" in currentNode) {
      stack.push(currentNode.valueB, currentNode.valueA);
    } else if ("value" in currentNode && isUnaryOperation(currentNode)) {
      stack.push(currentNode.value);
    }
  }

  return false;
};

export const mapScriptValueLeafNodes = (
  input: ScriptValue,
  fn: (val: ScriptValue) => ScriptValue
): ScriptValue => {
  if (isValueOperation(input)) {
    const mappedA = input.valueA && mapScriptValueLeafNodes(input.valueA, fn);
    const mappedB = input.valueB && mapScriptValueLeafNodes(input.valueB, fn);
    return {
      ...input,
      valueA: mappedA,
      valueB: mappedB,
    };
  }
  if (isUnaryOperation(input)) {
    const mapped = input.value && mapScriptValueLeafNodes(input.value, fn);
    return {
      ...input,
      value: mapped,
    };
  }
  return fn(input);
};

export const extractScriptValueActorIds = (input: ScriptValue): string[] => {
  const actorIds: string[] = [];
  walkScriptValue(input, (val) => {
    if (val.type === "property" && !actorIds.includes(val.target)) {
      actorIds.push(val.target);
    }
  });
  return actorIds;
};

export const extractScriptValueVariables = (input: ScriptValue): string[] => {
  const variables: string[] = [];
  walkScriptValue(input, (val) => {
    if (val.type === "variable" && !variables.includes(val.value)) {
      variables.push(val.value);
    } else if (val.type === "expression") {
      const text = val.value;
      if (text && typeof text === "string") {
        const expressionValue = expressionToScriptValue(text);
        const expressionVariables =
          extractScriptValueVariables(expressionValue);
        for (const expressionVariable of expressionVariables) {
          if (!variables.includes(expressionVariable)) {
            variables.push(expressionVariable);
          }
        }
      }
    }
  });
  return variables;
};

// recursively search script value for node containing variable, stop iterating on first match
export const variableInScriptValue = (
  variable: string,
  input: ScriptValue
): boolean => {
  return someInScriptValue(input, (val) => {
    if (val.type === "variable" && val.value === variable) {
      return true;
    } else if (val.type === "expression") {
      const text = val.value;
      if (text && typeof text === "string") {
        const expressionValue = expressionToScriptValue(text);
        return variableInScriptValue(variable, expressionValue);
      }
    }
    return false;
  });
};

export const precompileScriptValue = (
  input: ScriptValue,
  localsLabel = "",
  rpnOperations: PrecompiledValueRPNOperation[] = [],
  fetchOperations: PrecompiledValueFetch[] = []
): [PrecompiledValueRPNOperation[], PrecompiledValueFetch[]] => {
  if (input.type === "property" || input.type === "expression") {
    const localName = `local_${localsLabel}${fetchOperations.length}`;
    rpnOperations.push({
      type: "local",
      value: localName,
    });
    fetchOperations.push({
      local: localName,
      value: input,
    });
  } else if (isValueOperation(input)) {
    if (input.valueA) {
      precompileScriptValue(
        input.valueA,
        localsLabel,
        rpnOperations,
        fetchOperations
      );
    }
    if (input.valueB) {
      precompileScriptValue(
        input.valueB,
        localsLabel,
        rpnOperations,
        fetchOperations
      );
    }
    rpnOperations.push({
      type: input.type,
    });
  } else if (isUnaryOperation(input)) {
    if (input.value) {
      precompileScriptValue(
        input.value,
        localsLabel,
        rpnOperations,
        fetchOperations
      );
    }
    rpnOperations.push({
      type: input.type,
    });
  } else if (input.type === "true") {
    rpnOperations.push({ type: "number", value: 1 });
  } else if (input.type === "false") {
    rpnOperations.push({ type: "number", value: 0 });
  } else {
    rpnOperations.push(input);
  }
  return [rpnOperations, fetchOperations];
};

export const sortFetchOperations = (
  input: PrecompiledValueFetch[]
): PrecompiledValueFetch[] => {
  return [...input].sort((a, b) => {
    if (a.value.type === "property" && b.value.type === "property") {
      if (a.value.target === b.value.target) {
        // Sort on Prop
        return a.value.property.localeCompare(b.value.property);
      } else {
        // Sort on Target
        return a.value.target.localeCompare(b.value.target);
      }
    }
    return a.value.type.localeCompare(b.value.type);
  });
};

export const multiplyScriptValueConst = (
  value: ScriptValue,
  num: number
): ScriptValue => {
  return {
    type: "mul",
    valueA: value,
    valueB: {
      type: "number",
      value: num,
    },
  };
};

export const shiftLeftScriptValueConst = (
  value: ScriptValue,
  num: number
): ScriptValue => {
  return {
    type: "shl",
    valueA: value,
    valueB: {
      type: "number",
      value: num,
    },
  };
};

export const shiftRightScriptValueConst = (
  value: ScriptValue,
  num: number
): ScriptValue => {
  return {
    type: "shr",
    valueA: value,
    valueB: {
      type: "number",
      value: num,
    },
  };
};

export const addScriptValueConst = (
  value: ScriptValue,
  num: number
): ScriptValue => {
  return {
    type: "add",
    valueA: value,
    valueB: {
      type: "number",
      value: num,
    },
  };
};

export const addScriptValueToScriptValue = (
  valueA: ScriptValue,
  valueB: ScriptValue
): ScriptValue => {
  return {
    type: "add",
    valueA: valueA,
    valueB: valueB,
  };
};
