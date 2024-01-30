export type JsonValue = string | number | boolean | null;

export const isStringArray = (value: unknown): value is string[] => {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.every((v) => typeof v === "string");
};
