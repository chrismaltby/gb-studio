import { contextBridge } from "electron";
import APISetup from "renderer/lib/api/setup";
import "../../src/app/game/preload";
import "../../src/app/music/preload";
import "../../src/app/preferences/preload";
import "../../src/app/project/preload";
import "../../src/app/splash/preload";

// Mock the contextBridge module
jest.mock("electron", () => ({
  contextBridge: {
    exposeInMainWorld: jest.fn(),
  },
}));

test("should expose API to React application", () => {
  expect(contextBridge.exposeInMainWorld).toHaveBeenCalledTimes(5);

  expect(contextBridge.exposeInMainWorld).toHaveBeenNthCalledWith(
    1,
    "API",
    APISetup
  );
  expect(contextBridge.exposeInMainWorld).toHaveBeenNthCalledWith(
    2,
    "API",
    APISetup
  );

  expect(contextBridge.exposeInMainWorld).toHaveBeenNthCalledWith(
    3,
    "API",
    APISetup
  );
  expect(contextBridge.exposeInMainWorld).toHaveBeenNthCalledWith(
    4,
    "API",
    APISetup
  );
  expect(contextBridge.exposeInMainWorld).toHaveBeenNthCalledWith(
    5,
    "API",
    APISetup
  );
});
