export type JsonValue = string | number | boolean | null;

/* KeysMatching<T, V>
 *
 * Find all keys in T which have the type V
 * e.g. KeysMatching<Actor, boolean> to return "animate" | "isPinned"
 */
export type KeysMatching<T, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];

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
  return typeof value === "number" && !isNaN(value);
};

export const isUndefined = (value: unknown): value is undefined => {
  return value === undefined;
};

export const isMaybeString = (value: unknown): value is string | undefined => {
  return isString(value) || isUndefined(value);
};

export const isMaybeNumber = (value: unknown): value is number | undefined => {
  return isNumber(value) || isUndefined(value);
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

export const ensureMaybeString = ensureTypeGenerator(isMaybeString);
export const ensureMaybeNumber = ensureTypeGenerator(isMaybeNumber);
