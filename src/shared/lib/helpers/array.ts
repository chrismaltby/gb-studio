import uniq from "lodash/uniq";

export const chunk = <T>(arr: T[], len?: number): T[][] => {
  if (!len) {
    return [arr];
  }

  const chunks: T[][] = [];
  const n = arr.length;
  let i = 0;
  while (i < n) {
    chunks.push(arr.slice(i, (i += len)));
  }

  return chunks;
};

export const filterUndefined = <T>(arr: (T | undefined)[]): T[] => {
  return arr.filter((t) => t !== undefined);
};

export const moveArrayElement = <T>(
  x: number,
  y: number,
  [...xs]: T[],
): T[] => {
  if (
    xs.length <= 1 ||
    x === y ||
    x < 0 ||
    x >= xs.length ||
    y < 0 ||
    y >= xs.length
  ) {
    return xs;
  }
  const [element] = xs.splice(x, 1);
  xs.splice(y, 0, element);
  return xs;
};

export const moveArrayElements = <T>(
  fromIndexes: number[],
  to: number,
  arr: T[],
): T[] => {
  const sortedIndexes = uniq([...fromIndexes].sort((a, b) => a - b));
  const selectedItems = sortedIndexes.map((index) => arr[index]);

  const remainingItems = arr.filter(
    (_, index) => !sortedIndexes.includes(index),
  );

  const adjustedIndex =
    to > sortedIndexes[sortedIndexes.length - 1]
      ? to - sortedIndexes.length + 1
      : to;

  return [
    ...remainingItems.slice(0, adjustedIndex),
    ...selectedItems,
    ...remainingItems.slice(adjustedIndex),
  ];
};

export const sortSubsetStringArray = (
  arr: string[],
  sortOrder: string[],
): string[] => {
  const orderMap = new Map<string, number>();
  sortOrder.forEach((element, index) => orderMap.set(element, index));
  return arr
    .filter((element) => orderMap.has(element))
    .sort((a, b) => (orderMap.get(a) ?? 0) - (orderMap.get(b) ?? 0));
};

export const insertAfterElement = <T>(
  arr: T[],
  insertElement: T,
  afterElement: T,
): T[] => {
  const insertIndex = arr.indexOf(afterElement);
  if (insertIndex !== -1) {
    return [
      ...arr.slice(0, insertIndex + 1),
      insertElement,
      ...arr.slice(insertIndex + 1),
    ];
  } else {
    return arr.concat(insertElement);
  }
};

export const toggleArrayElement = <T>(arr: T[], element: T): T[] => {
  const index = arr.indexOf(element);
  if (index !== -1) {
    return arr.filter((_, i) => i !== index);
  } else {
    return [...arr, element];
  }
};

export const removeArrayElement = <T>(arr: T[], element: T): T[] => {
  const index = arr.indexOf(element);
  if (index !== -1) {
    return arr.filter((_, i) => i !== index);
  } else {
    return arr;
  }
};

export const removeArrayElements = <T>(arr: T[], elements: T[]): T[] => {
  return arr.filter((e) => !elements.includes(e));
};
