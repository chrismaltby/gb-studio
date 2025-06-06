import { ScriptValue } from "./types";

interface ScriptValueToStringOptions {
  variableNameForId: (value: string) => string;
  constantNameForId: (value: string) => string;
  actorNameForId: (value: string) => string;
  propertyNameForId: (value: string) => string;
  directionForValue: (value: string) => string;
}

export const assertUnreachable = (_x: never): never => {
  throw new Error("Didn't expect to get here");
};

export const scriptValueToString = (
  value: ScriptValue | undefined,
  options: ScriptValueToStringOptions,
): string => {
  if (!value) {
    return "0";
  }
  if (value.type === "number") {
    return String(value.value);
  } else if (value.type === "variable") {
    return options.variableNameForId(value.value);
  } else if (value.type === "constant") {
    return options.constantNameForId(value.value);
  } else if (value.type === "direction") {
    return options.directionForValue(value.value);
  } else if (value.type === "property") {
    return `${options.actorNameForId(value.target)}.${options.propertyNameForId(
      value.property,
    )}`;
  } else if (value.type === "expression") {
    return String(value.value || "0")
      .replace(/\$([VLT]*[0-9]+)\$/g, (_, match) => {
        return options.variableNameForId(match);
      })
      .replace(/@([a-z0-9-]{36})@/g, (_, match) => {
        return `||constant:${match}||`;
      });
  } else if (value.type === "true") {
    return "true";
  } else if (value.type === "false") {
    return "false";
  } else if (value.type === "add") {
    return `(${scriptValueToString(
      value.valueA,
      options,
    )} + ${scriptValueToString(value.valueB, options)})`;
  } else if (value.type === "sub") {
    return `(${scriptValueToString(
      value.valueA,
      options,
    )} - ${scriptValueToString(value.valueB, options)})`;
  } else if (value.type === "mul") {
    return `(${scriptValueToString(
      value.valueA,
      options,
    )} * ${scriptValueToString(value.valueB, options)})`;
  } else if (value.type === "div") {
    return `(${scriptValueToString(
      value.valueA,
      options,
    )} / ${scriptValueToString(value.valueB, options)})`;
  } else if (value.type === "mod") {
    return `(${scriptValueToString(
      value.valueA,
      options,
    )} % ${scriptValueToString(value.valueB, options)})`;
  } else if (value.type === "gt") {
    return `(${scriptValueToString(
      value.valueA,
      options,
    )} > ${scriptValueToString(value.valueB, options)})`;
  } else if (value.type === "gte") {
    return `(${scriptValueToString(
      value.valueA,
      options,
    )} >= ${scriptValueToString(value.valueB, options)})`;
  } else if (value.type === "lt") {
    return `(${scriptValueToString(
      value.valueA,
      options,
    )} < ${scriptValueToString(value.valueB, options)})`;
  } else if (value.type === "lte") {
    return `(${scriptValueToString(
      value.valueA,
      options,
    )} <= ${scriptValueToString(value.valueB, options)})`;
  } else if (value.type === "eq") {
    return `(${scriptValueToString(
      value.valueA,
      options,
    )} == ${scriptValueToString(value.valueB, options)})`;
  } else if (value.type === "ne") {
    return `(${scriptValueToString(
      value.valueA,
      options,
    )} != ${scriptValueToString(value.valueB, options)})`;
  } else if (value.type === "min") {
    return `min(${scriptValueToString(
      value.valueA,
      options,
    )},${scriptValueToString(value.valueB, options)})`;
  } else if (value.type === "max") {
    return `max(${scriptValueToString(
      value.valueA,
      options,
    )},${scriptValueToString(value.valueB, options)})`;
  } else if (value.type === "and") {
    return `(${scriptValueToString(
      value.valueA,
      options,
    )} && ${scriptValueToString(value.valueB, options)})`;
  } else if (value.type === "or") {
    return `(${scriptValueToString(
      value.valueA,
      options,
    )} || ${scriptValueToString(value.valueB, options)})`;
  } else if (value.type === "not") {
    return `!(${scriptValueToString(value.value, options)})`;
  } else if (value.type === "shl") {
    return `(${scriptValueToString(
      value.valueA,
      options,
    )} << ${scriptValueToString(value.valueB, options)})`;
  } else if (value.type === "shr") {
    return `(${scriptValueToString(
      value.valueA,
      options,
    )} >> ${scriptValueToString(value.valueB, options)})`;
  } else if (value.type === "bAND") {
    return `(${scriptValueToString(
      value.valueA,
      options,
    )} & ${scriptValueToString(value.valueB, options)})`;
  } else if (value.type === "bOR") {
    return `(${scriptValueToString(
      value.valueA,
      options,
    )} | ${scriptValueToString(value.valueB, options)})`;
  } else if (value.type === "bXOR") {
    return `(${scriptValueToString(
      value.valueA,
      options,
    )} ^ ${scriptValueToString(value.valueB, options)})`;
  } else if (value.type === "bNOT") {
    return `~(${scriptValueToString(value.value, options)})`;
  } else if (value.type === "abs") {
    return `abs(${scriptValueToString(value.value, options)})`;
  } else if (value.type === "isqrt") {
    return `isqrt(${scriptValueToString(value.value, options)})`;
  } else if (value.type === "atan2") {
    return `atan2(${scriptValueToString(
      value.valueA,
      options,
    )},${scriptValueToString(value.valueB, options)})`;
  } else if (value.type === "rnd") {
    return `rnd(${scriptValueToString(value.value, options)})`;
  } else if (value.type === "indirect") {
    return `INDIRECT`;
  }

  assertUnreachable(value.type);

  return "";
};
