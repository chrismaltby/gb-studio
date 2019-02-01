export const indexArray = (arr, index) =>
  arr.reduce((memo, row) => {
    memo[row[index]] = row;
    return memo;
  }, {});
