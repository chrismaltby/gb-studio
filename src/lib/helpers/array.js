export const indexBy = (property) => (arr) =>
  arr.reduce((memo, elem) => {
    const key = elem[property];
    return {
      ...memo,
      [key]: elem,
    };
  }, {});

export const indexByFn = (fn) => (arr) =>
  arr.reduce((memo, elem, index) => {
    const key = fn(elem, index, arr);
    return {
      ...memo,
      [key]: elem,
    };
  }, {});

export const groupByFn = (fn) => (arr) =>
  arr.reduce((memo, elem, index) => {
    const key = fn(elem, index, arr);
    return {
      ...memo,
      [key]: [].concat(memo.key || [], elem),
    };
  }, {});

export const groupBy = (property) => (arr) =>
  arr.reduce((memo, elem) => {
    const key = elem[property] || "";
    return {
      ...memo,
      [key]: [].concat(memo[key] || [], elem),
    };
  }, {});

export const flatten = (arr) => [].concat(...arr);
