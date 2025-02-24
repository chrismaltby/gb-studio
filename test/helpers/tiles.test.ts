import { resizeTiles } from "shared/lib/helpers/tiles";

describe("resizeTiles", () => {
  it("should return same tiles if size unmodified", () => {
    const input = [1, 2, 3, 4];
    const output = resizeTiles(input, 2, 2, 2, 2);
    expect(output).toBe(input);
  });

  it("should crop tiles if size is smaller horizontally", () => {
    const input = [1, 2, 3, 4];
    const output = resizeTiles(input, 2, 2, 1, 2);
    expect(output).toEqual([1, 3]);
  });

  it("should crop tiles if size is smaller vertically", () => {
    const input = [1, 2, 3, 4];
    const output = resizeTiles(input, 2, 2, 2, 1);
    expect(output).toEqual([1, 2]);
  });

  it("should crop tiles if size is smaller on both axis", () => {
    const input = [1, 2, 3, 4];
    const output = resizeTiles(input, 2, 2, 1, 1);
    expect(output).toEqual([1]);
  });

  it("should add tiles if size is larger horizontally", () => {
    const input = [1, 2, 3, 4];
    const output = resizeTiles(input, 2, 2, 3, 2);
    expect(output).toEqual([1, 2, 0, 3, 4, 0]);
  });

  it("should add tiles if size is larger vertically", () => {
    const input = [1, 2, 3, 4];
    const output = resizeTiles(input, 2, 2, 2, 3);
    expect(output).toEqual([1, 2, 3, 4, 0, 0]);
  });

  it("should add tiles if size is larger on both axis", () => {
    const input = [1, 2, 3, 4];
    const output = resizeTiles(input, 2, 2, 3, 3);
    expect(output).toEqual([1, 2, 0, 3, 4, 0, 0, 0, 0]);
  });

  it("should return empty array if new width is 0", () => {
    const input = [1, 2, 3, 4];
    const output = resizeTiles(input, 2, 2, 0, 3);
    expect(output).toEqual([]);
  });

  it("should return empty array if new height is 0", () => {
    const input = [1, 2, 3, 4];
    const output = resizeTiles(input, 2, 2, 2, 0);
    expect(output).toEqual([]);
  });

  it("should return empty array if both axis is 0", () => {
    const input = [1, 2, 3, 4];
    const output = resizeTiles(input, 2, 2, 0, 0);
    expect(output).toEqual([]);
  });

  it("should return empty array if new width is negative", () => {
    const input = [1, 2, 3, 4];
    const output = resizeTiles(input, 2, 2, -1, 3);
    expect(output).toEqual([]);
  });

  it("should return empty array if new height is negative", () => {
    const input = [1, 2, 3, 4];
    const output = resizeTiles(input, 2, 2, 2, -1);
    expect(output).toEqual([]);
  });

  it("should return empty array if both axis is negative", () => {
    const input = [1, 2, 3, 4];
    const output = resizeTiles(input, 2, 2, -1, -1);
    expect(output).toEqual([]);
  });
});
