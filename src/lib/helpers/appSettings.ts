import settings from "electron-settings";
import { promiseRetry } from "shared/lib/helpers/promise";

type SettingsValue = Parameters<typeof settings.set>[1];

// Set electron-settings filename to
// match previous releases
settings.configure({
  fileName: "Settings",
});

let settingsMutationQueue: Promise<void> = Promise.resolve();

const queueSettingsMutation = <T>(operation: () => Promise<T>): Promise<T> => {
  const result = settingsMutationQueue.then(operation, operation);

  settingsMutationQueue = result.then(
    () => undefined,
    () => undefined,
  );

  return result;
};

const isTransientFilesystemError = (error: unknown): boolean => {
  if (
    !(error instanceof Error) ||
    !("code" in error) ||
    typeof error.code !== "string"
  ) {
    return false;
  }

  if (["EBUSY", "EMFILE", "ENFILE"].includes(error.code)) {
    return true;
  }

  return (
    process.platform === "win32" && ["EACCES", "EPERM"].includes(error.code)
  );
};

export const settingsSet = async (
  key: string,
  value: SettingsValue,
): Promise<void> =>
  queueSettingsMutation(() =>
    promiseRetry(() => settings.set(key, value), {
      retries: 5,
      shouldRetry: isTransientFilesystemError,
    }),
  );

export const settingsGet = (key: string) =>
  promiseRetry(() => settings.get(key), {
    retries: 5,
    shouldRetry: isTransientFilesystemError,
  });

export const settingsGetAll = () =>
  promiseRetry(() => settings.get(), {
    retries: 5,
    shouldRetry: isTransientFilesystemError,
  });

export const settingsUnset = async (key: string): Promise<void> =>
  queueSettingsMutation(() =>
    promiseRetry(() => settings.unset(key), {
      retries: 5,
      shouldRetry: isTransientFilesystemError,
    }),
  );

export const settingsUpdate = async (
  key: string,
  update: (currentValue: unknown) => SettingsValue,
): Promise<void> =>
  queueSettingsMutation(async () => {
    const currentValue = await settingsGet(key);
    const nextValue = update(currentValue);
    await promiseRetry(() => settings.set(key, nextValue), {
      retries: 5,
      shouldRetry: isTransientFilesystemError,
    });
  });
