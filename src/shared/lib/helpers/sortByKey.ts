export const sortByKey = <T extends Record<string, unknown>>(input: T): T => {
  return Object.keys(input)
    .sort()
    .reduce(
      (obj, key) => {
        obj[key] = input[key];
        return obj;
      },
      Object.create(null) as Record<string, unknown>,
    ) as T;
};
