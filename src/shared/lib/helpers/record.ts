export const valuesOf = <T>(record: Record<string | number | symbol, T>): T[] =>
  Object.values(record);
