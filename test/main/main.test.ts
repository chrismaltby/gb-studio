import electron, { BrowserWindow } from "electron";
import settings from "electron-settings";
import { readFile, writeFile } from "fs-extra";
import {
  appendSearchParamsToURL,
  createPreferences,
  createProjectWindow,
  createSplash,
  normalizeFileURL,
} from "../../src/apps/gb-studio/main";
import { checkForUpdate } from "lib/helpers/updateChecker";

jest.mock("electron");
jest.mock("electron-settings");
jest.mock("fs-extra");
jest.mock("open", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@octokit/rest", () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    repos: {
      getLatestRelease: jest.fn(),
    },
  })),
}));
jest.mock("lib/helpers/updateChecker");
jest.mock("lib/project/createProject");
jest.mock("../../src/apps/gb-studio/menu");

const mockedElectron = jest.mocked(electron);
const mockedSettings = jest.mocked(settings);
const mockedCheckForUpdate = jest.mocked(checkForUpdate);
const mockedReadFile = jest.mocked(readFile);
const mockedWriteFile = jest.mocked(writeFile);

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
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("normalizes packaged Windows file URLs", () => {
    expect(
      normalizeFileURL(
        "file://C:\\Users\\runneradmin\\AppData\\Local\\gb_studio\\app-4.4.0\\.webpack\\renderer\\splash_window\\index.html",
        "win32",
      ),
    ).toBe(
      "file:///C:/Users/runneradmin/AppData/Local/gb_studio/app-4.4.0/.webpack/renderer/splash_window/index.html",
    );

    expect(
      normalizeFileURL(
        "file://C:/Users/runneradmin/AppData/Local/gb_studio/app-4.4.0/.webpack/renderer/splash_window/index.html",
        "win32",
      ),
    ).toBe(
      "file:///C:/Users/runneradmin/AppData/Local/gb_studio/app-4.4.0/.webpack/renderer/splash_window/index.html",
    );
  });

  test("appends query params after normalizing packaged Windows file URLs", () => {
    expect(
      appendSearchParamsToURL(
        "file://C:\\Users\\runneradmin\\AppData\\Local\\gb_studio\\app-4.4.0\\.webpack\\renderer\\main_window\\index.html",
        { path: "C:\\Projects\\Game\\project.gbsproj" },
        "win32",
      ),
    ).toBe(
      "file:///C:/Users/runneradmin/AppData/Local/gb_studio/app-4.4.0/.webpack/renderer/main_window/index.html?path=C%3A%5CProjects%5CGame%5Cproject.gbsproj",
    );
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
        variables: ["0"],
        rows: [
          {
            label: "Row 1",
            values: [{ type: "number", value: 10 }],
          },
        ],
      },
      [],
    );

    expect(exportHandler).toBeDefined();
    expect(mockedWriteFile).toHaveBeenCalledWith(
      "/tmp/data.csv",
      "Scores,0\nRow 1,10",
    );
  });

  test("registers a CSV import IPC handler that parses imported files", async () => {
    const importHandler = getIpcHandler("data-table:import-csv");

    mockedElectron.dialog.showOpenDialogSync.mockReturnValueOnce([
      "/tmp/data.csv",
    ]);
    mockedReadFile.mockResolvedValueOnce("Scores,0\nRow 1,10" as never);

    const result = await importHandler?.({}, []);

    expect(importHandler).toBeDefined();
    expect(mockedReadFile).toHaveBeenCalledWith("/tmp/data.csv", "utf8");
    expect(result).toEqual({
      label: "Scores",
      variables: ["0"],
      rows: [
        {
          label: "Row 1",
          values: [{ type: "number", value: 10 }],
        },
      ],
    });
  });
});
