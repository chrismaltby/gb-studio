export default arr =>
  arr.reduce((memo, elem) => {
    return {
      ...memo,
      [elem.id]: elem
    };
  }, {});
