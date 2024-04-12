import {
  PrecompiledValueRPNOperation,
  PrecompiledValueFetch,
  isValueOperation,
  ScriptValue,
} from "./types";

const boolToInt = (val: boolean) => (val ? 1 : 0);
const zero = {
  type: "number",
  value: 0,
} as const;

export const optimiseScriptValue = (input: ScriptValue): ScriptValue => {
  if ("valueA" in input && input.type !== "rnd") {
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
      } else if (input.type === "not") {
        return {
          type: "number",
          value: boolToInt(!optimisedA.value),
        };
      }
    }

    return {
      ...input,
      valueA: optimisedA,
      valueB: optimisedB,
    };
  }
  return input;
};

const walkScriptValue = (
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
};

export const mapScriptValueLeafNodes = (
  input: ScriptValue,
  fn: (val: ScriptValue) => ScriptValue
): ScriptValue => {
  if ("valueA" in input && input.type !== "rnd") {
    const mappedA = input.valueA && mapScriptValueLeafNodes(input.valueA, fn);
    const mappedB = input.valueB && mapScriptValueLeafNodes(input.valueB, fn);
    return {
      ...input,
      valueA: mappedA,
      valueB: mappedB,
    };
  }

  if (!isValueOperation(input) && input.type !== "rnd") {
    return fn(input);
  }

  return input;
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
        const variablePtrs = text.match(/\$V[0-9]\$/g);
        if (variablePtrs) {
          variablePtrs.forEach((variablePtr: string) => {
            const variable = variablePtr[2];
            const variableId = `V${variable}`;
            if (!variables.includes(variableId)) {
              variables.push(variableId);
            }
          });
        }
      }
    }
  });
  return variables;
};

export const precompileScriptValue = (
  input: ScriptValue,
  localsLabel = "",
  rpnOperations: PrecompiledValueRPNOperation[] = [],
  fetchOperations: PrecompiledValueFetch[] = []
): [PrecompiledValueRPNOperation[], PrecompiledValueFetch[]] => {
  if (
    input.type === "property" ||
    input.type === "expression" ||
    input.type === "rnd"
  ) {
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
