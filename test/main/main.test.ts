import electron, { BrowserWindow } from "electron";
import { createPreferences, createSplash } from "../../src/main";
import { mocked } from "jest-mock";
import { checkForUpdate } from "lib/helpers/updateChecker";

jest.mock("electron");
jest.mock("fs-extra");
jest.mock("lib/helpers/updateChecker");
jest.mock("lib/project/createProject");
jest.mock("../../src/menu");

const mockedElectron = mocked(electron);
const mockedCheckForUpdate = mocked(checkForUpdate);

describe("Electron Main Process", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockedElectron.BrowserWindow.mockClear();
    mockedElectron.app.whenReady.mockClear();
    mockedCheckForUpdate.mockClear();
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
      () => mockBrowserWindow as any
    );

    await createSplash();

    expect(BrowserWindow).toHaveBeenCalledTimes(1);
    expect(mockBrowserWindow.loadURL).toHaveBeenCalledWith(
      `SPLASH_WINDOW_WEBPACK_ENTRY?tab=`
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
      () => mockBrowserWindow as any
    );

    await createSplash("recent");

    expect(BrowserWindow).toHaveBeenCalledTimes(1);
    expect(mockBrowserWindow.loadURL).toHaveBeenCalledWith(
      `SPLASH_WINDOW_WEBPACK_ENTRY?tab=recent`
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
      () => mockBrowserWindow as any
    );

    await createSplash();
    await createSplash();

    expect(mockBrowserWindow.webContents.on).toHaveBeenCalledTimes(2);
    expect(mockBrowserWindow.webContents.on).toHaveBeenCalledWith(
      "did-finish-load",
      expect.any(Function)
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
      () => mockBrowserWindow as any
    );

    await createPreferences();

    expect(BrowserWindow).toHaveBeenCalledTimes(1);
    expect(mockBrowserWindow.loadURL).toHaveBeenCalledWith(
      `PREFERENCES_WINDOW_WEBPACK_ENTRY`
    );
  });
});
