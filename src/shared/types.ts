export type JsonValue = string | number | boolean | null;

export const isStringArray = (value: unknown): value is string[] => {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.every(isString);
};

export const isString = (value: unknown): value is string => {
  return typeof value === "string";
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === "number";
};

export const ensureType = <T>(
  value: unknown,
  fallback: T,
  isType: (value: unknown) => value is T
): T => {
  return isType(value) ? value : fallback;
};

export const ensureTypeGenerator = <T>(
  isType: (value: unknown) => value is T
): ((value: unknown, fallback: T) => T) => {
  return (value: unknown, fallback: T) => (isType(value) ? value : fallback);
};

export const ensurePromisedTypeGenerator = <T>(
  isType: (value: unknown) => value is T
): ((promise: Promise<unknown>, fallback: T) => Promise<T>) => {
  return async (promise: Promise<unknown>, fallback: T): Promise<T> => {
    try {
      const value = await promise;
      return isType(value) ? value : fallback;
    } catch {
      return fallback;
    }
  };
};

export const ensureString = ensureTypeGenerator(isString);
export const ensureStringArray = ensureTypeGenerator(isStringArray);
export const ensureNumber = ensureTypeGenerator(isNumber);

export const ensurePromisedString = ensurePromisedTypeGenerator(isString);
export const ensurePromisedNumber = ensurePromisedTypeGenerator(isNumber);
