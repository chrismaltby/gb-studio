import settings from "electron-settings";
import {
  settingsSet,
  settingsUpdate,
} from "lib/helpers/appSettings";

jest.mock("electron-settings");

const mockedSettings = jest.mocked(settings);

const setPlatform = (platform: NodeJS.Platform) => {
  Object.defineProperty(process, "platform", {
    value: platform,
    configurable: true,
  });
};

const transientError = (code: string) => {
  const error = new Error(code) as NodeJS.ErrnoException;
  error.code = code;
  return error;
};

const deferred = <T = void>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
};

describe("appSettings", () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    jest.useFakeTimers();
    mockedSettings.configure.mockClear();
    mockedSettings.get.mockReset();
    mockedSettings.set.mockReset();
    mockedSettings.unset.mockReset();
    setPlatform(originalPlatform);
  });

  afterEach(() => {
    jest.useRealTimers();
    setPlatform(originalPlatform);
  });

  test("retries transient Windows EPERM errors and succeeds", async () => {
    setPlatform("win32");

    mockedSettings.set
      .mockRejectedValueOnce(transientError("EPERM") as never)
      .mockResolvedValueOnce(undefined as never);

    const result = settingsSet("theme", "dark");
    await jest.runAllTimersAsync();

    await expect(result).resolves.toBeUndefined();
    expect(mockedSettings.set).toHaveBeenCalledTimes(2);
  });

  test("retries EBUSY errors and succeeds", async () => {
    mockedSettings.set
      .mockRejectedValueOnce(transientError("EBUSY") as never)
      .mockResolvedValueOnce(undefined as never);

    const result = settingsSet("theme", "dark");
    await jest.runAllTimersAsync();

    await expect(result).resolves.toBeUndefined();
    expect(mockedSettings.set).toHaveBeenCalledTimes(2);
  });

  test("continues the mutation queue after one operation rejects", async () => {
    const error = new Error("failed");

    mockedSettings.set
      .mockRejectedValueOnce(error as never)
      .mockResolvedValueOnce(undefined as never);

    await expect(settingsSet("first", true)).rejects.toBe(error);
    await expect(settingsSet("second", true)).resolves.toBeUndefined();

    expect(mockedSettings.set).toHaveBeenNthCalledWith(1, "first", true);
    expect(mockedSettings.set).toHaveBeenNthCalledWith(2, "second", true);
  });

  test("serializes concurrent mutations", async () => {
    const firstWrite = deferred();

    mockedSettings.set
      .mockReturnValueOnce(firstWrite.promise as never)
      .mockResolvedValueOnce(undefined as never);

    const firstResult = settingsSet("first", true);
    const secondResult = settingsSet("second", true);

    await Promise.resolve();
    expect(mockedSettings.set).toHaveBeenCalledTimes(1);

    firstWrite.resolve();
    await firstResult;
    await Promise.resolve();

    expect(mockedSettings.set).toHaveBeenCalledTimes(2);
    expect(mockedSettings.set).toHaveBeenNthCalledWith(2, "second", true);
    await expect(secondResult).resolves.toBeUndefined();
  });

  test("serializes complete read-modify-write updates", async () => {
    const store = { count: 0 };
    const firstSet = deferred();

    mockedSettings.get.mockImplementation(
      async () => store.count as never,
    );
    mockedSettings.set.mockImplementation(async (_key, value) => {
      if (mockedSettings.set.mock.calls.length === 1) {
        await firstSet.promise;
      }
      store.count = value as number;
    });

    const firstResult = settingsUpdate("count", (value) => Number(value) + 1);
    const secondResult = settingsUpdate("count", (value) => Number(value) + 1);

    await Promise.resolve();
    expect(mockedSettings.get).toHaveBeenCalledTimes(1);

    firstSet.resolve();
    await Promise.all([firstResult, secondResult]);

    expect(store.count).toBe(2);
    expect(mockedSettings.get).toHaveBeenCalledTimes(2);
    expect(mockedSettings.set).toHaveBeenCalledTimes(2);
  });
});
