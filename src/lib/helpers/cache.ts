import memoize from "lodash/memoize";

const identity = <T>(t: T): T => t;

export const getCachedObject = memoize(identity, JSON.stringify);

export const createCacheFunction = () => {
  let lastId: string = "";
  let lastData: object = {};
  return (data: any) => {
    const id = JSON.stringify(data);
    if (lastId === id) {
      return lastData;
    }
    lastId = id;
    lastData = data;
    return data;
  };
};
