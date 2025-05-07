export const clone = <T>(input: T): T => {
  return JSON.parse(JSON.stringify(input));
};

export const cloneDictionary = <T>(
  dictionary: Record<string, T>
): Record<string, T> =>
  Object.keys(dictionary).reduce((memo, key) => {
    const value = dictionary[key];
    if (value) {
      memo[key] = JSON.parse(JSON.stringify(value));
    }
    return memo;
  }, {} as Record<string, T>);
