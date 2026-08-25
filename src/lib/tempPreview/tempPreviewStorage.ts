import { createHash } from "crypto";
import { safeStorage } from "electron";
import Path from "path";
import { settingsGet, settingsUpdate } from "lib/helpers/appSettings";
import type { TempPreviewRecord } from "lib/tempPreview/tempMdClient";

const SETTINGS_KEY = "tempMdPreviews";

type StoredTempPreviewRecord = Omit<TempPreviewRecord, "updateToken"> & {
  encryptedUpdateToken: string;
};

const memoryRecords = new Map<string, TempPreviewRecord>();

const projectKey = (projectPath: string): string =>
  createHash("sha256")
    .update(Path.normalize(Path.resolve(projectPath)))
    .digest("hex");

const canPersistSecurely = (): boolean => {
  if (!safeStorage.isEncryptionAvailable()) {
    return false;
  }
  return !(
    process.platform === "linux" &&
    safeStorage.getSelectedStorageBackend() === "basic_text"
  );
};

const storedRecords = (
  value: unknown,
): Record<string, StoredTempPreviewRecord> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, StoredTempPreviewRecord>;
};

export const loadTempPreview = async (
  projectPath: string,
): Promise<TempPreviewRecord | undefined> => {
  const key = projectKey(projectPath);
  const inMemory = memoryRecords.get(key);
  if (inMemory) {
    return inMemory;
  }
  if (!canPersistSecurely()) {
    return undefined;
  }
  try {
    const records = storedRecords(await settingsGet(SETTINGS_KEY));
    const stored = records[key];
    if (!isStoredRecord(stored)) {
      return undefined;
    }
    const updateToken = safeStorage.decryptString(
      Buffer.from(stored.encryptedUpdateToken, "base64"),
    );
    const record: TempPreviewRecord = {
      tempId: stored.tempId,
      canonicalUrl: stored.canonicalUrl,
      updateToken,
      expiresAt: stored.expiresAt,
      updatedAt: stored.updatedAt,
    };
    memoryRecords.set(key, record);
    return record;
  } catch {
    return undefined;
  }
};

export const saveTempPreview = async (
  projectPath: string,
  record: TempPreviewRecord,
): Promise<{ persistent: boolean }> => {
  const key = projectKey(projectPath);
  memoryRecords.set(key, record);
  if (!canPersistSecurely()) {
    return { persistent: false };
  }
  try {
    const encryptedUpdateToken = safeStorage
      .encryptString(record.updateToken)
      .toString("base64");
    await settingsUpdate(SETTINGS_KEY, (currentValue) => ({
      ...storedRecords(currentValue),
      [key]: {
        tempId: record.tempId,
        canonicalUrl: record.canonicalUrl,
        expiresAt: record.expiresAt,
        updatedAt: record.updatedAt,
        encryptedUpdateToken,
      },
    }));
    return { persistent: true };
  } catch {
    return { persistent: false };
  }
};

export const deleteTempPreview = async (projectPath: string): Promise<void> => {
  const key = projectKey(projectPath);
  memoryRecords.delete(key);
  await settingsUpdate(SETTINGS_KEY, (currentValue) => {
    const records = { ...storedRecords(currentValue) };
    delete records[key];
    return records;
  });
};

export const clearTempPreviewMemoryForTests = (): void => {
  memoryRecords.clear();
};

const isStoredRecord = (
  value: StoredTempPreviewRecord | undefined,
): value is StoredTempPreviewRecord => {
  if (
    !value ||
    typeof value.tempId !== "string" ||
    typeof value.canonicalUrl !== "string" ||
    typeof value.encryptedUpdateToken !== "string" ||
    typeof value.updatedAt !== "string" ||
    !(value.expiresAt === null || typeof value.expiresAt === "string")
  ) {
    return false;
  }
  try {
    const url = new URL(value.canonicalUrl);
    return (
      url.protocol === "https:" &&
      (url.hostname === "temp.md" || url.hostname.endsWith(".temp.md"))
    );
  } catch {
    return false;
  }
};
