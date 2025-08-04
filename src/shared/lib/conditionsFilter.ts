export interface BaseCondition {
  key: string;
  ne?: unknown;
  eq?: unknown;
  gt?: unknown;
  lt?: unknown;
  gte?: unknown;
  lte?: unknown;
  in?: unknown[];
  set?: boolean;
  truthy?: boolean;
  [customKey: string]: unknown;
}

type ValueGetter = (key: string) => unknown;
type CustomEvaluator = (condition: BaseCondition, value: unknown) => boolean;

export const evaluateConditions = (
  conditions: BaseCondition[],
  getValue: ValueGetter,
  ignoreConditions?: string[],
  customEval?: CustomEvaluator,
): boolean => {
  if (conditions.length === 0) return true;

  return conditions.reduce((memo, condition) => {
    if (ignoreConditions?.includes(condition.key)) {
      return memo;
    }

    const value = getValue(condition.key);

    const baseChecks =
      (!("eq" in condition) || value === condition.eq) &&
      (!("ne" in condition) || value !== condition.ne) &&
      (!("truthy" in condition) || !!value === condition.truthy) &&
      (!("falsy" in condition) || !!value === condition.falsy) &&
      (!("gt" in condition) || Number(value) > Number(condition.gt)) &&
      (!("gte" in condition) || Number(value) >= Number(condition.gte)) &&
      (!("lt" in condition) || Number(value) < Number(condition.lt)) &&
      (!("lte" in condition) || Number(value) <= Number(condition.lte)) &&
      (!condition.in ||
        condition.in.includes(value) ||
        (value === undefined && condition.in.includes(null))) &&
      (condition.set === undefined ||
        (condition.set && value !== undefined) ||
        (!condition.set && value === undefined));

    if (!baseChecks) {
      return false;
    }

    const customChecks = customEval ? customEval(condition, value) : true;

    if (!customChecks) {
      return false;
    }

    return memo;
  }, true);
};
