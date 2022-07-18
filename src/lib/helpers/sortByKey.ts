export const sortByKey = <T extends Record<string, unknown>>(input: T): T => {
  return Object.keys(input)
    .sort()
    .reduce((obj, key) => {
      obj[key] = input[key];
      return obj;
    }, {} as Record<string, unknown>) as T;
};
