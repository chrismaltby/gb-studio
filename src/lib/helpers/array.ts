type AnyRecord = Record<string, any>
type AnyRecordArray = AnyRecord[]
type ArrayFn = (elem: AnyRecord, index: number, arr: AnyRecordArray) => string;

export const indexBy = (property: string) => (arr: AnyRecordArray) =>
  arr.reduce((memo, elem) => {
    const key = elem[property];
    return {
      ...memo,
      [key]: elem,
    };
  }, {});

export const indexByFn = (fn: ArrayFn) => (arr: AnyRecordArray) =>
  arr.reduce((memo, elem, index) => {
    const key = fn(elem, index, arr);
    return {
      ...memo,
      [key]: elem,
    };
  }, {});

export const groupByFn = (fn: ArrayFn) => (arr: AnyRecordArray) =>
  arr.reduce((memo, elem, index) => {
    const key = fn(elem, index, arr);
    return {
      ...memo,
      [key]: ([] as AnyRecordArray).concat(memo.key || [], elem),
    };
  }, {});

export const groupBy = (property: string) => (arr: AnyRecordArray) =>
  arr.reduce((memo, elem) => {
    const key = elem[property] || "";
    return {
      ...memo,
      [key]: ([] as AnyRecordArray).concat(memo[key] || [], elem),
    };
  }, {});

