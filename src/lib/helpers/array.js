export const indexBy = key => arr =>
  arr.reduce((memo, elem) => {
    return {
      ...memo,
      [elem[key]]: elem
    };
  }, {});

export const flatten = arr => [].concat(...arr);
