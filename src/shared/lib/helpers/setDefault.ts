export const setDefault = <T>(value: T | undefined, defaultValue: T) => {
  return value === undefined ? defaultValue : value;
};
