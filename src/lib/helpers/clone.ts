import { Dictionary } from "@reduxjs/toolkit";

export const clone = <T>(input: T): T => {
  return JSON.parse(JSON.stringify(input));
};

export const cloneDictionary = <T extends unknown>(
  dictionary: Dictionary<T>
): Dictionary<T> =>
  Object.keys(dictionary).reduce((memo, key) => {
    const value = dictionary[key];
    if (value) {
      memo[key] = JSON.parse(JSON.stringify(value));
    }
    return memo;
  }, {} as Dictionary<T>);
