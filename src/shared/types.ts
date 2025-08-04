export type JsonValue = string | number | boolean | null;

declare const __brand: unique symbol;
type Brand<B> = { [__brand]: B };
export type Branded<T, B> = T & Brand<B>;

export type DeepReadonly<T> = {
  readonly [Key in keyof T]: T[Key] extends unknown[] | Record<string, unknown>
    ? DeepReadonly<T[Key]>
    : T[Key];
};

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
  return typeof value === "number" && !isNaN(value) && isFinite(value);
};

export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === "boolean";
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
  isType: (value: unknown) => value is T,
): T => {
  return isType(value) ? value : fallback;
};

export const ensureTypeGenerator = <T>(
  isType: (value: unknown) => value is T,
): ((value: unknown, fallback: T) => T) => {
  return (value: unknown, fallback: T) => (isType(value) ? value : fallback);
};

export const ensurePromisedTypeGenerator = <T>(
  isType: (value: unknown) => value is T,
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
export const ensureBoolean = ensureTypeGenerator(isBoolean);

export const ensurePromisedString = ensurePromisedTypeGenerator(isString);
export const ensurePromisedNumber = ensurePromisedTypeGenerator(isNumber);

export const ensureMaybeString = ensureTypeGenerator(isMaybeString);
export const ensureMaybeNumber = ensureTypeGenerator(isMaybeNumber);

export const omit = <T, O extends keyof T>(
  obj: T,
  ...keys: O[]
): Omit<T, O> => {
  const ret = {} as {
    [K in keyof typeof obj]: (typeof obj)[K];
  };
  let key: keyof typeof obj;
  for (key in obj) {
    if (!keys.includes(key as O)) {
      ret[key] = obj[key];
    }
  }
  return ret;
};
