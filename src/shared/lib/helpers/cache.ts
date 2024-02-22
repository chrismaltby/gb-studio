import memoize from "lodash/memoize";

const identity = <T>(t: T): T => t;

export const getCachedObject = memoize(identity, JSON.stringify);

export const createCacheFunction = <T>() => {
  let lastId = "";
  let lastData: T | null = null;
  return (data: T) => {
    const id = JSON.stringify(data);
    if (lastId === id && lastData) {
      return lastData;
    }
    lastId = id;
    lastData = data;
    return data;
  };
};
