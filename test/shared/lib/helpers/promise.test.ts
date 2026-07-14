import { promiseRetry } from "shared/lib/helpers/promise";

describe("promiseRetry", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("does not retry unrelated errors", async () => {
    const error = new Error("no retry");
    const operation = jest.fn().mockRejectedValue(error);

    const result = promiseRetry(operation, {
      shouldRetry: () => false,
    });

    await expect(result).rejects.toBe(error);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  test("throws after six total attempts with retries set to five", async () => {
    const error = new Error("retry");
    const operation = jest.fn().mockRejectedValue(error);

    const result = promiseRetry(operation, {
      retries: 5,
      delayMs: 1,
      shouldRetry: () => true,
    });
    const expectation = expect(result).rejects.toBe(error);

    await jest.runAllTimersAsync();

    await expectation;
    expect(operation).toHaveBeenCalledTimes(6);
  });
});
