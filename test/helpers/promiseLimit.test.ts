import promiseLimit from "lib/helpers/promiseLimit";

describe("promiseLimit", () => {
  const createPromise = <T>(value: T, delay: number): (() => Promise<T>) => {
    return () =>
      new Promise((resolve) => setTimeout(() => resolve(value), delay));
  };

  const createRejectingPromise = (reason: unknown, delay: number) => {
    return () =>
      new Promise((_, reject) => setTimeout(() => reject(reason), delay));
  };

  test("should resolve empty array when list is empty", async () => {
    const result = await promiseLimit(2, []);
    expect(result).toEqual([]);
  });

  test("should resolve with all promises when n is larger than list length", async () => {
    const promises = [createPromise(1, 100), createPromise(2, 200)];
    const result = await promiseLimit(3, promises);
    expect(result).toEqual([1, 2]);
  });

  test("should resolve with all promises when n is equal to list length", async () => {
    const promises = [createPromise(1, 100), createPromise(2, 200)];
    const result = await promiseLimit(2, promises);
    expect(result).toEqual([1, 2]);
  });

  test("should resolve promises in order when n is smaller than list length", async () => {
    const promises = [
      createPromise(1, 100),
      createPromise(2, 200),
      createPromise(3, 50),
    ];
    const result = await promiseLimit(2, promises);
    expect(result).toEqual([1, 2, 3]);
  });

  test("should resolve even if some promises resolve immediately", async () => {
    const promises = [
      createPromise(1, 0),
      createPromise(2, 100),
      createPromise(3, 50),
    ];
    const result = await promiseLimit(2, promises);
    expect(result).toEqual([1, 2, 3]);
  });

  test("should reject if any promise rejects", async () => {
    const promises = [
      createPromise(1, 100),
      createRejectingPromise("error", 50),
      createPromise(3, 200),
    ];

    await expect(promiseLimit(2, promises)).rejects.toEqual("error");
  });

  test("should handle mixed resolving and rejecting promises", async () => {
    const promises = [
      createPromise(1, 100),
      createRejectingPromise("error1", 50),
      createRejectingPromise("error2", 150),
      createPromise(4, 200),
    ];

    await expect(promiseLimit(2, promises)).rejects.toEqual("error1");
  });

  test("should work with non-numeric values and different data types", async () => {
    const promises = [
      createPromise("a", 100),
      createPromise({ key: "value" }, 50),
      createPromise([1, 2, 3], 200),
    ];
    const result = await promiseLimit<string | number[] | { key: string }>(
      2,
      promises
    );
    expect(result).toEqual(["a", { key: "value" }, [1, 2, 3]]);
  });
});
