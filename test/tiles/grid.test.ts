import {
  clearGridSelection,
  moveGridSelection,
  moveGridSelectionMasked,
} from "shared/lib/tiles/grid";

describe("clearGridSelection", () => {
  test("It clears a rectangular selection", () => {
    const result = clearGridSelection(
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      3,
      3,
      { x: 1, y: 1, width: 2, height: 2 },
      0,
    );

    expect(result).toEqual([1, 2, 3, 4, 0, 0, 7, 0, 0]);
  });

  test("It does not mutate the source array", () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    clearGridSelection(values, 3, 3, { x: 1, y: 1, width: 2, height: 2 }, 0);

    expect(values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  test("It clips selections that start outside the grid", () => {
    const result = clearGridSelection(
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      3,
      3,
      { x: -1, y: -1, width: 3, height: 3 },
      0,
    );

    expect(result).toEqual([0, 0, 3, 0, 0, 6, 7, 8, 9]);
  });

  test("It clips selections that end outside the grid", () => {
    const result = clearGridSelection(
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      3,
      3,
      { x: 2, y: 1, width: 4, height: 4 },
      0,
    );

    expect(result).toEqual([1, 2, 3, 4, 5, 0, 7, 8, 0]);
  });

  test("It pads short input arrays with the empty value", () => {
    const result = clearGridSelection(
      [1, 2, 3],
      3,
      2,
      { x: 1, y: 0, width: 1, height: 2 },
      0,
    );

    expect(result).toEqual([1, 0, 3, 0, 0, 0]);
  });

  test("It replaces undefined values with the empty value", () => {
    const result = clearGridSelection(
      [1, undefined, 3] as Array<number | undefined>,
      3,
      1,
      { x: 0, y: 0, width: 1, height: 1 },
      0,
    );

    expect(result).toEqual([0, 0, 3]);
  });

  test("It supports generic values", () => {
    const result = clearGridSelection(
      ["a", "b", "c", "d"],
      2,
      2,
      { x: 1, y: 0, width: 1, height: 2 },
      "",
    );

    expect(result).toEqual(["a", "", "c", ""]);
  });

  test("It truncates input arrays longer than the grid size", () => {
    const result = clearGridSelection(
      [1, 2, 3, 4, 5, 6],
      2,
      2,
      { x: 0, y: 0, width: 1, height: 1 },
      0,
    );

    expect(result).toEqual([0, 2, 3, 4]);
  });

  test("It leaves the grid unchanged when the selection is entirely outside the grid", () => {
    const result = clearGridSelection(
      [1, 2, 3, 4],
      2,
      2,
      { x: 3, y: 0, width: 2, height: 2 },
      0,
    );

    expect(result).toEqual([1, 2, 3, 4]);
  });

  test("It leaves the grid unchanged when the selection has zero width", () => {
    const result = clearGridSelection(
      [1, 2, 3, 4],
      2,
      2,
      { x: 0, y: 0, width: 0, height: 2 },
      0,
    );

    expect(result).toEqual([1, 2, 3, 4]);
  });

  test("It leaves the grid unchanged when the selection has zero height", () => {
    const result = clearGridSelection(
      [1, 2, 3, 4],
      2,
      2,
      { x: 0, y: 0, width: 2, height: 0 },
      0,
    );

    expect(result).toEqual([1, 2, 3, 4]);
  });

  test("It returns an empty array for an empty grid", () => {
    const result = clearGridSelection(
      [1, 2, 3],
      0,
      0,
      { x: 0, y: 0, width: 1, height: 1 },
      0,
    );

    expect(result).toEqual([]);
  });
});

describe("moveGridSelection", () => {
  test("It moves a rectangular selection", () => {
    const result = moveGridSelection(
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      3,
      3,
      { x: 0, y: 0, width: 2, height: 2 },
      { x: 1, y: 1 },
      0,
    );

    expect(result).toEqual([0, 0, 3, 0, 1, 2, 7, 4, 5]);
  });

  test("It does not mutate the source array", () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    moveGridSelection(
      values,
      3,
      3,
      { x: 0, y: 0, width: 2, height: 2 },
      { x: 1, y: 1 },
      0,
    );

    expect(values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  test("It handles overlapping moves without losing source values", () => {
    const result = moveGridSelection(
      [1, 2, 3, 4, 5, 6, 7, 8],
      4,
      2,
      { x: 0, y: 0, width: 3, height: 2 },
      { x: 1, y: 0 },
      0,
    );

    expect(result).toEqual([0, 1, 2, 3, 0, 5, 6, 7]);
  });

  test("It clears the original selection when moved", () => {
    const result = moveGridSelection(
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      3,
      3,
      { x: 0, y: 1, width: 1, height: 2 },
      { x: 2, y: -1 },
      0,
    );

    expect(result).toEqual([1, 2, 4, 0, 5, 7, 0, 8, 9]);
  });

  test("It clips source selections that start outside the grid", () => {
    const result = moveGridSelection(
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      3,
      3,
      { x: -1, y: -1, width: 3, height: 3 },
      { x: 1, y: 1 },
      0,
    );

    expect(result).toEqual([0, 0, 3, 0, 1, 2, 7, 4, 5]);
  });

  test("It drops moved cells that would land outside the grid", () => {
    const result = moveGridSelection(
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      3,
      3,
      { x: 1, y: 1, width: 2, height: 2 },
      { x: 1, y: 1 },
      0,
    );

    expect(result).toEqual([1, 2, 3, 4, 0, 0, 7, 0, 5]);
  });

  test("It pads short input arrays with the empty value before moving", () => {
    const result = moveGridSelection(
      [1, 2, 3],
      3,
      2,
      { x: 0, y: 0, width: 2, height: 1 },
      { x: 1, y: 1 },
      0,
    );

    expect(result).toEqual([0, 0, 3, 0, 1, 2]);
  });

  test("It replaces undefined values with the empty value before moving", () => {
    const result = moveGridSelection(
      [1, undefined, 3] as Array<number | undefined>,
      3,
      1,
      { x: 0, y: 0, width: 2, height: 1 },
      { x: 1, y: 0 },
      0,
    );

    expect(result).toEqual([0, 1, 0]);
  });

  test("It returns a normalized copy when offset is zero", () => {
    const result = moveGridSelection(
      [1, undefined, 3] as Array<number | undefined>,
      3,
      1,
      { x: 0, y: 0, width: 2, height: 1 },
      { x: 0, y: 0 },
      0,
    );

    expect(result).toEqual([1, 0, 3]);
  });

  test("It supports generic values", () => {
    const result = moveGridSelection(
      ["a", "b", "c", "d", "e", "f"],
      3,
      2,
      { x: 0, y: 0, width: 2, height: 1 },
      { x: 1, y: 1 },
      "",
    );

    expect(result).toEqual(["", "", "c", "d", "a", "b"]);
  });

  test("It truncates input arrays longer than the grid size", () => {
    const result = moveGridSelection(
      [1, 2, 3, 4, 5, 6],
      2,
      2,
      { x: 0, y: 0, width: 1, height: 1 },
      { x: 1, y: 1 },
      0,
    );

    expect(result).toEqual([0, 2, 3, 1]);
  });

  test("It leaves the grid unchanged when the selection is entirely outside the grid", () => {
    const result = moveGridSelection(
      [1, 2, 3, 4],
      2,
      2,
      { x: 3, y: 0, width: 2, height: 2 },
      { x: -1, y: 0 },
      0,
    );

    expect(result).toEqual([1, 2, 3, 4]);
  });

  test("It moves a selection left and up", () => {
    const result = moveGridSelection(
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      3,
      3,
      { x: 1, y: 1, width: 2, height: 2 },
      { x: -1, y: -1 },
      0,
    );

    expect(result).toEqual([5, 6, 3, 8, 9, 0, 7, 0, 0]);
  });

  test("It leaves the grid unchanged when moving a zero-width selection", () => {
    const result = moveGridSelection(
      [1, 2, 3, 4],
      2,
      2,
      { x: 0, y: 0, width: 0, height: 2 },
      { x: 1, y: 0 },
      0,
    );

    expect(result).toEqual([1, 2, 3, 4]);
  });

  test("It leaves the grid unchanged when moving a zero-height selection", () => {
    const result = moveGridSelection(
      [1, 2, 3, 4],
      2,
      2,
      { x: 0, y: 0, width: 2, height: 0 },
      { x: 0, y: 1 },
      0,
    );

    expect(result).toEqual([1, 2, 3, 4]);
  });

  test("It returns an empty array for an empty grid", () => {
    const result = moveGridSelection(
      [1, 2, 3],
      0,
      0,
      { x: 0, y: 0, width: 1, height: 1 },
      { x: 1, y: 1 },
      0,
    );

    expect(result).toEqual([]);
  });
});

describe("moveGridSelectionMasked", () => {
  test("moves masked grid selections using source and target predicates", () => {
    const result = moveGridSelectionMasked(
      [1, 2, 3, 4, 5, 6],
      3,
      2,
      { x: 0, y: 0, width: 2, height: 1 },
      { x: 1, y: 1 },
      0,
      (sourceIndex) => sourceIndex === 0 || sourceIndex === 1,
      (targetIndex) => targetIndex !== 4,
    );

    expect(result).toEqual([0, 0, 3, 4, 5, 2]);
  });

  test("does not clear or move cells rejected by the source predicate", () => {
    const result = moveGridSelectionMasked(
      [1, 2, 3, 4],
      2,
      2,
      { x: 0, y: 0, width: 2, height: 1 },
      { x: 0, y: 1 },
      0,
      (sourceIndex) => sourceIndex === 1,
      () => true,
    );

    expect(result).toEqual([1, 0, 3, 2]);
  });

  test("clears moving masked source cells even when their target is outside the grid", () => {
    const result = moveGridSelectionMasked(
      [1, 2, 3, 4],
      2,
      2,
      { x: 0, y: 0, width: 2, height: 1 },
      { x: 0, y: -1 },
      0,
      () => true,
      () => true,
    );

    expect(result).toEqual([0, 0, 3, 4]);
  });
});
