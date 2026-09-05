import electron, { BrowserWindow } from "electron";
import settings from "electron-settings";
import { readFile, writeFile } from "fs-extra";
import {
  createPreferences,
  createProjectWindow,
  createSplash,
} from "../../src/apps/gb-studio/main";
import { checkForUpdate } from "lib/helpers/updateChecker";
import buildProject from "lib/compiler/buildProject";
import { collectBuildUsage } from "lib/compiler/buildUsage";
import getTmp from "lib/helpers/getTmp";
import { clearAppCache } from "lib/helpers/cache";
import { dummyProjectResources } from "../dummydata";
import type { BuildManifest } from "lib/compiler/buildManifest";

jest.mock("electron");
jest.mock("electron-settings");
jest.mock("fs-extra");
jest.mock("@octokit/rest", () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    repos: {
      getLatestRelease: jest.fn(),
    },
  })),
}));
jest.mock("lib/helpers/updateChecker");
jest.mock("lib/compiler/buildProject");
jest.mock("lib/compiler/buildUsage");
jest.mock("lib/helpers/getTmp");
jest.mock("lib/helpers/cache");
jest.mock("lib/project/createProject");
jest.mock("../../src/apps/gb-studio/menu");

const mockedElectron = jest.mocked(electron);
const mockedSettings = jest.mocked(settings);
const mockedCheckForUpdate = jest.mocked(checkForUpdate);
const mockedReadFile = jest.mocked(readFile);
const mockedWriteFile = jest.mocked(writeFile);
const mockedBuildProject = jest.mocked(buildProject);
const mockedCollectBuildUsage = jest.mocked(collectBuildUsage);
const mockedGetTmp = jest.mocked(getTmp);
const mockedClearAppCache = jest.mocked(clearAppCache);

const completeUsage = {
  status: "complete" as const,
  memory: {
    rom: {
      used: 100,
      size: 4 * 1024 * 1024,
      requiredSize: 128 * 1024,
      nextSize: 256 * 1024,
      usedPercent: (100 * 100) / (128 * 1024),
      maxUsedPercent: (100 * 100) / (4 * 1024 * 1024),
    },
    bank0: { used: 50, size: 16 * 1024 },
    wram: { used: 25, size: 8 * 1024 },
  },
};

const manifest: BuildManifest = {
  buildRoot: "/tmp/_gbsbuild",
  cartType: "mbc5",
  sources: [],
  artifacts: {
    romPath: "/tmp/_gbsbuild/build/rom/game.gb",
    mapPath: "/tmp/_gbsbuild/build/rom/game.map",
    noiPath: "/tmp/_gbsbuild/build/rom/game.noi",
  },
};

const buildOptions = {
  buildType: "rom" as const,
  engineSchema: {} as never,
  exportBuild: false,
  debugEnabled: false,
};

const getIpcHandler = (channel: string) => {
  const handlerCall = mockedElectron.ipcMain.handle.mock.calls.find(
    ([registeredChannel]) => registeredChannel === channel,
  );
  return handlerCall?.[1] as
    ((...args: unknown[]) => Promise<unknown>) | undefined;
};

describe("Electron Main Process", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockedElectron.BrowserWindow.mockClear();
    mockedElectron.app.whenReady.mockClear();
    mockedCheckForUpdate.mockClear();
    mockedElectron.dialog.showOpenDialogSync.mockClear();
    mockedElectron.dialog.showSaveDialogSync.mockClear();
    mockedSettings.get.mockReset();
    mockedReadFile.mockReset();
    mockedWriteFile.mockReset();
    mockedBuildProject.mockReset();
    mockedCollectBuildUsage.mockReset();
    mockedGetTmp.mockReset().mockResolvedValue("/tmp");
    mockedClearAppCache.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("createSplash creates a BrowserWindow", async () => {
    const mockBrowserWindow = {
      loadURL: jest.fn(),
      on: jest.fn(),
      webContents: {
        on: jest.fn(),
      },
      setMenu: jest.fn(),
      show: jest.fn(),
    } as unknown as jest.Mocked<BrowserWindow>;

    mockedElectron.BrowserWindow.mockImplementationOnce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      () => mockBrowserWindow as any,
    );

    await createSplash();

    expect(BrowserWindow).toHaveBeenCalledTimes(1);
    expect(mockBrowserWindow.loadURL).toHaveBeenCalledWith(
      `SPLASH_WINDOW_WEBPACK_ENTRY?tab=`,
    );
  });

  test("createSplash with a specified tab loads that tab", async () => {
    const mockBrowserWindow = {
      loadURL: jest.fn(),
      on: jest.fn(),
      webContents: {
        on: jest.fn(),
      },
      setMenu: jest.fn(),
      show: jest.fn(),
    }; // as unknown as jest.Mocked<BrowserWindow>;

    mockedElectron.BrowserWindow.mockImplementationOnce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      () => mockBrowserWindow as any,
    );

    await createSplash("recent");

    expect(BrowserWindow).toHaveBeenCalledTimes(1);
    expect(mockBrowserWindow.loadURL).toHaveBeenCalledWith(
      `SPLASH_WINDOW_WEBPACK_ENTRY?tab=recent`,
    );
  });

  test("createSplash checks for updates on load, but only the first time", async () => {
    jest.useFakeTimers();

    const mockBrowserWindow = {
      loadURL: jest.fn(),
      on: jest.fn(),
      webContents: {
        on: jest.fn().mockImplementation((arg1, arg2) => arg2()),
      },
      setMenu: jest.fn(),
      show: jest.fn(),
    } as unknown as jest.Mocked<BrowserWindow>;

    mockedElectron.BrowserWindow.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      () => mockBrowserWindow as any,
    );

    await createSplash();
    await createSplash();

    expect(mockBrowserWindow.webContents.on).toHaveBeenCalledTimes(2);
    expect(mockBrowserWindow.webContents.on).toHaveBeenCalledWith(
      "did-finish-load",
      expect.any(Function),
    );

    jest.runAllTimers();

    expect(mockedCheckForUpdate).toHaveBeenCalledTimes(1);
  });

  test("createPreferences creates a BrowserWindow", async () => {
    const mockBrowserWindow = {
      loadURL: jest.fn(),
      on: jest.fn(),
      webContents: {
        on: jest.fn(),
      },
      setMenu: jest.fn(),
      show: jest.fn(),
    } as unknown as jest.Mocked<BrowserWindow>;

    mockedElectron.BrowserWindow.mockImplementationOnce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      () => mockBrowserWindow as any,
    );

    await createPreferences();

    expect(BrowserWindow).toHaveBeenCalledTimes(1);
    expect(mockBrowserWindow.loadURL).toHaveBeenCalledWith(
      `PREFERENCES_WINDOW_WEBPACK_ENTRY`,
    );
  });

  test("project window load still sends open-project when spellcheck refresh fails", async () => {
    (
      global as typeof globalThis & {
        MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
        MAIN_WINDOW_WEBPACK_ENTRY: string;
      }
    ).MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY = "MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY";
    (
      global as typeof globalThis & {
        MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
        MAIN_WINDOW_WEBPACK_ENTRY: string;
      }
    ).MAIN_WINDOW_WEBPACK_ENTRY = "MAIN_WINDOW_WEBPACK_ENTRY";

    const didFinishLoadHandlers: Array<() => void> = [];
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockedSettings.get.mockRejectedValueOnce(new Error("settings failed"));

    const mockBrowserWindow = {
      loadURL: jest.fn(),
      on: jest.fn(),
      webContents: {
        on: jest.fn().mockImplementation((event, handler) => {
          if (event === "did-finish-load") {
            didFinishLoadHandlers.push(handler);
          }
        }),
        send: jest.fn(),
        session: {
          availableSpellCheckerLanguages: ["en"],
          setSpellCheckerEnabled: jest.fn(),
          setSpellCheckerLanguages: jest.fn(),
        },
      },
      setRepresentedFilename: jest.fn(),
      setMenu: jest.fn(),
      show: jest.fn(),
    } as unknown as jest.Mocked<BrowserWindow>;

    mockedElectron.BrowserWindow.mockImplementationOnce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      () => mockBrowserWindow as any,
    );

    await createProjectWindow();
    didFinishLoadHandlers[0]();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(mockBrowserWindow.webContents.send).toHaveBeenCalledWith(
      "open-project",
      "",
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Unable to refresh spell check settings",
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  test("registers a CSV export IPC handler that writes the serialized table", async () => {
    const exportHandler = getIpcHandler("data-table:export-csv");

    mockedElectron.dialog.showSaveDialogSync.mockReturnValueOnce(
      "/tmp/data.csv",
    );

    await exportHandler?.(
      {},
      {
        label: "Scores",
        variables: [{ type: "variable", value: "variable-1" }],
        rows: [
          {
            label: "Row 1",
            values: [{ type: "number", value: 10 }],
          },
        ],
      },
      [],
      [{ id: "variable-1", name: "Score", type: "number" }],
    );

    expect(exportHandler).toBeDefined();
    expect(mockedWriteFile).toHaveBeenCalledWith(
      "/tmp/data.csv",
      "Scores,Score\nRow 1,10",
    );
  });

  test("registers a CSV import IPC handler that parses imported files", async () => {
    const importHandler = getIpcHandler("data-table:import-csv");

    mockedElectron.dialog.showOpenDialogSync.mockReturnValueOnce([
      "/tmp/data.csv",
    ]);
    mockedReadFile.mockResolvedValueOnce("Scores,Score\nRow 1,10" as never);

    const result = await importHandler?.(
      {},
      [],
      [{ id: "variable-1", name: "Score", type: "number" }],
    );

    expect(importHandler).toBeDefined();
    expect(mockedReadFile).toHaveBeenCalledWith("/tmp/data.csv", "utf8");
    expect(result).toEqual({
      dataTable: {
        label: "Scores",
        variables: [{ type: "variable", value: "variable-1" }],
        rows: [
          {
            label: "Row 1",
            values: [{ type: "number", value: 10 }],
          },
        ],
      },
      newVariables: [],
    });
  });

  test("collects and returns usage after a successful project build", async () => {
    const buildHandler = getIpcHandler("project:build");
    mockedBuildProject.mockResolvedValue({
      status: "success",
      compiledData: {} as never,
      manifest,
    });
    mockedCollectBuildUsage.mockResolvedValue(completeUsage);

    const result = await buildHandler?.(
      {},
      dummyProjectResources,
      buildOptions,
    );

    expect(mockedCollectBuildUsage).toHaveBeenCalledWith({
      manifest,
      tmpPath: "/tmp",
      progress: expect.any(Function),
      warnings: expect.any(Function),
    });
    expect(result).toEqual({
      status: "success",
      usage: completeUsage,
      debuggerSymbols: undefined,
    });
  });

  test("does not collect usage after a failed project build", async () => {
    const buildHandler = getIpcHandler("project:build");
    mockedBuildProject.mockResolvedValue({
      status: "failed",
      error: "link failed",
    });

    await expect(
      buildHandler?.({}, dummyProjectResources, buildOptions),
    ).resolves.toEqual({ status: "failed", error: "link failed" });
    expect(mockedCollectBuildUsage).not.toHaveBeenCalled();
  });

  test("does not collect usage after a cancelled project build", async () => {
    const buildHandler = getIpcHandler("project:build");
    mockedBuildProject.mockResolvedValue({ status: "cancelled" });

    await expect(
      buildHandler?.({}, dummyProjectResources, buildOptions),
    ).resolves.toEqual({ status: "cancelled" });
    expect(mockedCollectBuildUsage).not.toHaveBeenCalled();
  });

  test("keeps a successful project build successful when usage analysis fails", async () => {
    const buildHandler = getIpcHandler("project:build");
    const failedUsage = {
      status: "failed" as const,
    };
    mockedBuildProject.mockResolvedValue({
      status: "success",
      compiledData: {} as never,
      manifest,
    });
    mockedCollectBuildUsage.mockResolvedValue(failedUsage);

    await expect(
      buildHandler?.({}, dummyProjectResources, buildOptions),
    ).resolves.toEqual({
      status: "success",
      usage: failedUsage,
      debuggerSymbols: undefined,
    });
  });
});
