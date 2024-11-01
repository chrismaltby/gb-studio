import {
  moveArrayElement,
  moveArrayElements,
  sortSubsetStringArray,
  insertAfterElement,
} from "shared/lib/helpers/array";

describe("moveArrayElement", () => {
  test("moves element from index x to index y", () => {
    const arr = ["a", "b", "c", "d"];
    const result = moveArrayElement(1, 3, arr);
    expect(result).toEqual(["a", "c", "d", "b"]);
  });

  test("returns original array if x equals y", () => {
    const arr = ["a", "b", "c", "d"];
    const result = moveArrayElement(2, 2, arr);
    expect(result).toEqual(arr);
  });

  test("returns original array if x is out of bounds", () => {
    const arr = ["a", "b", "c", "d"];
    const result = moveArrayElement(-1, 2, arr);
    expect(result).toEqual(arr);
  });

  test("returns original array if y is out of bounds", () => {
    const arr = ["a", "b", "c", "d"];
    const result = moveArrayElement(1, 4, arr);
    expect(result).toEqual(arr);
  });

  test("returns original array if array length is <= 1", () => {
    const arr = ["a"];
    const result = moveArrayElement(0, 0, arr);
    expect(result).toEqual(arr);
  });

  test("does not mutate the original array", () => {
    const arr = ["a", "b", "c", "d"];
    const arrCopy = [...arr];
    moveArrayElement(1, 3, arr);
    expect(arr).toEqual(arrCopy);
  });

  test("moves element to the beginning", () => {
    const arr = ["a", "b", "c", "d"];
    const result = moveArrayElement(2, 0, arr);
    expect(result).toEqual(["c", "a", "b", "d"]);
  });

  test("moves element to the end", () => {
    const arr = ["a", "b", "c", "d"];
    const result = moveArrayElement(0, 3, arr);
    expect(result).toEqual(["b", "c", "d", "a"]);
  });

  test("handles array with duplicate elements", () => {
    const arr = ["a", "b", "a", "c"];
    const result = moveArrayElement(0, 2, arr);
    expect(result).toEqual(["b", "a", "a", "c"]);
  });

  test("handles numeric arrays", () => {
    const arr = [1, 2, 3, 4];
    const result = moveArrayElement(1, 2, arr);
    expect(result).toEqual([1, 3, 2, 4]);
  });
});

describe("moveArrayElements", () => {
  test("moves multiple elements to a specified position", () => {
    const arr = ["a", "b", "c", "d", "e"];
    const result = moveArrayElements([1, 3], 2, arr);
    expect(result).toEqual(["a", "c", "b", "d", "e"]);
  });

  test("moves elements to the beginning of the array", () => {
    const arr = ["a", "b", "c", "d", "e"];
    const result = moveArrayElements([2, 4], 0, arr);
    expect(result).toEqual(["c", "e", "a", "b", "d"]);
  });

  test("moves elements to the end of the array", () => {
    const arr = ["a", "b", "c", "d", "e"];
    const result = moveArrayElements([0, 1], 4, arr);
    expect(result).toEqual(["c", "d", "e", "a", "b"]);
  });

  test("returns original array if fromIndexes is empty", () => {
    const arr = ["a", "b", "c"];
    const result = moveArrayElements([], 1, arr);
    expect(result).toEqual(arr);
  });

  test("does not mutate the original array", () => {
    const arr = ["a", "b", "c", "d"];
    const arrCopy = [...arr];
    moveArrayElements([1, 2], 0, arr);
    expect(arr).toEqual(arrCopy);
  });

  test("moves elements forward correctly", () => {
    const arr = [1, 2, 3, 4, 5];
    const result = moveArrayElements([1, 2], 4, arr);
    expect(result).toEqual([1, 4, 5, 2, 3]);
  });

  test("moves elements backward correctly", () => {
    const arr = [1, 2, 3, 4, 5];
    const result = moveArrayElements([3, 4], 1, arr);
    expect(result).toEqual([1, 4, 5, 2, 3]);
  });

  test("ignores duplicate indices in fromIndexes", () => {
    const arr = ["a", "b", "c", "d"];
    const result = moveArrayElements([1, 1], 2, arr);
    expect(result).toEqual(["a", "c", "b", "d"]);
  });

  test("handles to index greater than last fromIndex", () => {
    const arr = ["a", "b", "c", "d", "e"];
    const result = moveArrayElements([1, 2], 4, arr);
    expect(result).toEqual(["a", "d", "e", "b", "c"]);
  });

  test("handles to index less than first fromIndex", () => {
    const arr = ["a", "b", "c", "d", "e"];
    const result = moveArrayElements([3, 4], 1, arr);
    expect(result).toEqual(["a", "d", "e", "b", "c"]);
  });

  test("works when to is equal to the length of the array", () => {
    const arr = ["a", "b", "c", "d"];
    const result = moveArrayElements([1, 2], 4, arr);
    expect(result).toEqual(["a", "d", "b", "c"]);
  });

  test("works when to is zero", () => {
    const arr = ["a", "b", "c", "d"];
    const result = moveArrayElements([2, 3], 0, arr);
    expect(result).toEqual(["c", "d", "a", "b"]);
  });
});

describe("sortSubsetStringArray", () => {
  test("sorts subset of arr according to sortOrder", () => {
    const arr = ["apple", "banana", "cherry", "date"];
    const sortOrder = ["cherry", "apple", "banana"];
    const result = sortSubsetStringArray(arr, sortOrder);
    expect(result).toEqual(["cherry", "apple", "banana"]);
  });

  test("excludes elements not in sortOrder", () => {
    const arr = ["apple", "banana", "cherry", "date"];
    const sortOrder = ["banana", "cherry"];
    const result = sortSubsetStringArray(arr, sortOrder);
    expect(result).toEqual(["banana", "cherry"]);
  });

  test("returns empty array if arr is empty", () => {
    const arr: string[] = [];
    const sortOrder = ["apple", "banana"];
    const result = sortSubsetStringArray(arr, sortOrder);
    expect(result).toEqual([]);
  });

  test("returns empty array if sortOrder is empty", () => {
    const arr = ["apple", "banana"];
    const sortOrder: string[] = [];
    const result = sortSubsetStringArray(arr, sortOrder);
    expect(result).toEqual([]);
  });

  test("returns empty array if both arr and sortOrder are empty", () => {
    const arr: string[] = [];
    const sortOrder: string[] = [];
    const result = sortSubsetStringArray(arr, sortOrder);
    expect(result).toEqual([]);
  });

  test("handles duplicates in arr", () => {
    const arr = ["apple", "banana", "apple", "date"];
    const sortOrder = ["apple", "banana"];
    const result = sortSubsetStringArray(arr, sortOrder);
    expect(result).toEqual(["apple", "apple", "banana"]);
  });

  test("ignores duplicates in sortOrder", () => {
    const arr = ["apple", "banana", "cherry"];
    const sortOrder = ["banana", "banana", "apple"];
    const result = sortSubsetStringArray(arr, sortOrder);
    expect(result).toEqual(["banana", "apple"]);
  });

  test("is case-sensitive", () => {
    const arr = ["Apple", "banana", "Cherry"];
    const sortOrder = ["apple", "banana", "cherry"];
    const result = sortSubsetStringArray(arr, sortOrder);
    expect(result).toEqual(["banana"]);
  });

  test("does not mutate the original arrays", () => {
    const arr = ["apple", "banana", "cherry"];
    const sortOrder = ["cherry", "apple", "banana"];
    const arrCopy = [...arr];
    const sortOrderCopy = [...sortOrder];
    sortSubsetStringArray(arr, sortOrder);
    expect(arr).toEqual(arrCopy);
    expect(sortOrder).toEqual(sortOrderCopy);
  });

  test("handles elements in sortOrder not in arr", () => {
    const arr = ["apple", "banana"];
    const sortOrder = ["cherry", "apple", "banana"];
    const result = sortSubsetStringArray(arr, sortOrder);
    expect(result).toEqual(["apple", "banana"]);
  });

  test("returns empty array if no elements in arr are in sortOrder", () => {
    const arr = ["apple", "banana"];
    const sortOrder = ["cherry", "date"];
    const result = sortSubsetStringArray(arr, sortOrder);
    expect(result).toEqual([]);
  });

  test("handles arr with multiple elements not in sortOrder", () => {
    const arr = ["apple", "banana", "cherry", "date", "fig"];
    const sortOrder = ["cherry", "date"];
    const result = sortSubsetStringArray(arr, sortOrder);
    expect(result).toEqual(["cherry", "date"]);
  });

  test("handles when arr and sortOrder have the same elements but in different order", () => {
    const arr = ["banana", "apple", "cherry"];
    const sortOrder = ["cherry", "apple", "banana"];
    const result = sortSubsetStringArray(arr, sortOrder);
    expect(result).toEqual(["cherry", "apple", "banana"]);
  });
});

describe("insertAfterElement", () => {
  test("inserts element after existing element in the middle of the array", () => {
    const originalArray = [1, 2, 3, 4];
    const result = insertAfterElement(originalArray, 99, 2);
    expect(result).toEqual([1, 2, 99, 3, 4]);
    expect(originalArray).toEqual([1, 2, 3, 4]);
  });

  test("inserts element after existing element at the beginning of the array", () => {
    const originalArray = [1, 2, 3];
    const result = insertAfterElement(originalArray, 99, 1);
    expect(result).toEqual([1, 99, 2, 3]);
    expect(originalArray).toEqual([1, 2, 3]);
  });

  test("inserts element after existing element at the end of the array", () => {
    const originalArray = [1, 2, 3];
    const result = insertAfterElement(originalArray, 99, 3);
    expect(result).toEqual([1, 2, 3, 99]);
    expect(originalArray).toEqual([1, 2, 3]);
  });

  test("appends element if afterElement is not found in arr", () => {
    const originalArray = [1, 2, 3];
    const result = insertAfterElement(originalArray, 99, 4);
    expect(result).toEqual([1, 2, 3, 99]);
    expect(originalArray).toEqual([1, 2, 3]);
  });

  test("with empty array, should result in array with the insertElement", () => {
    const originalArray: number[] = [];
    const result = insertAfterElement(originalArray, 99, 1);
    expect(result).toEqual([99]);
    expect(originalArray).toEqual([]);
  });

  test("does not mutate original array when element found", () => {
    const originalArray = [1, 2, 3];
    const originalArrayCopy = [...originalArray];
    insertAfterElement(originalArray, 99, 2);
    expect(originalArray).toEqual(originalArrayCopy);
  });

  test("does not mutate original array when element wasn't found", () => {
    const originalArray = [1, 2, 3];
    const originalArrayCopy = [...originalArray];
    insertAfterElement(originalArray, 99, 50);
    expect(originalArray).toEqual(originalArrayCopy);
  });

  test("handles arrays with duplicate elements", () => {
    const originalArray = [1, 2, 2, 3];
    const result = insertAfterElement(originalArray, 99, 2);
    expect(result).toEqual([1, 2, 99, 2, 3]);
    expect(originalArray).toEqual([1, 2, 2, 3]);
  });

  test("inserts after the first occurrence of afterElement when there are duplicates", () => {
    const originalArray = [1, 2, 3, 2, 4];
    const result = insertAfterElement(originalArray, 99, 2);
    expect(result).toEqual([1, 2, 99, 3, 2, 4]);
    expect(originalArray).toEqual([1, 2, 3, 2, 4]);
  });

  test("when afterElement is the same as insertElement", () => {
    const originalArray = [1, 2, 3];
    const result = insertAfterElement(originalArray, 2, 2);
    expect(result).toEqual([1, 2, 2, 3]);
    expect(originalArray).toEqual([1, 2, 3]);
  });

  test("works with arrays of numbers", () => {
    const originalArray = [1, 2, 3];
    const result = insertAfterElement(originalArray, 99, 2);
    expect(result).toEqual([1, 2, 99, 3]);
    expect(originalArray).toEqual([1, 2, 3]);
  });

  test("works with arrays of strings", () => {
    const originalArray = ["a", "b", "c"];
    const result = insertAfterElement(originalArray, "x", "b");
    expect(result).toEqual(["a", "b", "x", "c"]);
    expect(originalArray).toEqual(["a", "b", "c"]);
  });

  test("works with arrays of objects", () => {
    const obj1 = { id: 1 };
    const obj2 = { id: 2 };
    const obj3 = { id: 3 };
    const objToInsert = { id: 99 };
    const originalArray = [obj1, obj2, obj3];
    const result = insertAfterElement(originalArray, objToInsert, obj2);
    expect(result).toEqual([obj1, obj2, objToInsert, obj3]);
    expect(originalArray).toEqual([obj1, obj2, obj3]);
  });

  test("works when afterElement is null or undefined", () => {
    const originalArray = [null, undefined, "a"];
    const result = insertAfterElement(originalArray, "x", null);
    expect(result).toEqual([null, "x", undefined, "a"]);
    expect(originalArray).toEqual([null, undefined, "a"]);
  });

  test("works when insertElement is null or undefined", () => {
    const originalArray = ["a", "b", "c"];
    const result = insertAfterElement(originalArray, null, "b");
    expect(result).toEqual(["a", "b", null, "c"]);
    expect(originalArray).toEqual(["a", "b", "c"]);
  });

  test("works when arr contains null or undefined elements", () => {
    const originalArray = [1, undefined, 3];
    const result = insertAfterElement(originalArray, 99, undefined);
    expect(result).toEqual([1, undefined, 99, 3]);
    expect(originalArray).toEqual([1, undefined, 3]);
  });

  test("works when elements are arrays", () => {
    const arr1 = [1];
    const arr2 = [2];
    const arr3 = [3];
    const arrToInsert = [99];
    const originalArray = [arr1, arr2, arr3];
    const result = insertAfterElement(originalArray, arrToInsert, arr2);
    expect(result).toEqual([arr1, arr2, arrToInsert, arr3]);
    expect(originalArray).toEqual([arr1, arr2, arr3]);
  });
});
