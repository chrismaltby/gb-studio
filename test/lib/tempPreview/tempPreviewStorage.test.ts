import { safeStorage } from "electron";
import {
  clearTempPreviewMemoryForTests,
  deleteTempPreview,
  loadTempPreview,
  saveTempPreview,
} from "lib/tempPreview/tempPreviewStorage";
import type { TempPreviewRecord } from "lib/tempPreview/tempMdClient";

let settingsValue: unknown = {};

jest.mock("electron");
jest.mock("lib/helpers/appSettings", () => ({
  settingsGet: jest.fn(async () => settingsValue),
  settingsUpdate: jest.fn(
    async (_key: string, update: (value: unknown) => unknown) => {
      settingsValue = update(settingsValue);
    },
  ),
}));

const record: TempPreviewRecord = {
  tempId: "preview-1",
  canonicalUrl: "https://preview-1.temp.md/",
  updateToken: "update-secret",
  expiresAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-08-25T00:00:00.000Z",
};

describe("temp preview storage", () => {
  beforeEach(() => {
    settingsValue = {};
    clearTempPreviewMemoryForTests();
    jest.mocked(safeStorage.isEncryptionAvailable).mockReturnValue(true);
  });

  test("persists only an encrypted update capability", async () => {
    await expect(
      saveTempPreview("/projects/game/game.gbsproj", record),
    ).resolves.toEqual({ persistent: true });
    expect(JSON.stringify(settingsValue)).not.toContain("update-secret");

    clearTempPreviewMemoryForTests();
    await expect(
      loadTempPreview("/projects/game/game.gbsproj"),
    ).resolves.toEqual(record);
  });

  test("falls back to process memory when secure storage is unavailable", async () => {
    jest.mocked(safeStorage.isEncryptionAvailable).mockReturnValue(false);

    await expect(
      saveTempPreview("/projects/game/game.gbsproj", record),
    ).resolves.toEqual({ persistent: false });
    expect(settingsValue).toEqual({});
    await expect(
      loadTempPreview("/projects/game/game.gbsproj"),
    ).resolves.toEqual(record);

    clearTempPreviewMemoryForTests();
    await expect(
      loadTempPreview("/projects/game/game.gbsproj"),
    ).resolves.toBeUndefined();
  });

  test("removes both the memory and persisted records", async () => {
    await saveTempPreview("/projects/game/game.gbsproj", record);
    await deleteTempPreview("/projects/game/game.gbsproj");
    clearTempPreviewMemoryForTests();
    await expect(
      loadTempPreview("/projects/game/game.gbsproj"),
    ).resolves.toBeUndefined();
  });
});
