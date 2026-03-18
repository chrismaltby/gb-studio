import { contextBridge } from "electron";
import APISetup from "renderer/lib/api/setup";
import "../../src/apps/gb-studio/game/preload";
import "../../src/apps/gb-studio/music/preload";
import "../../src/apps/gb-studio/preferences/preload";
import "../../src/apps/gb-studio/project/preload";
import "../../src/apps/gb-studio/splash/preload";

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
    APISetup,
  );
  expect(contextBridge.exposeInMainWorld).toHaveBeenNthCalledWith(
    2,
    "API",
    APISetup,
  );

  expect(contextBridge.exposeInMainWorld).toHaveBeenNthCalledWith(
    3,
    "API",
    APISetup,
  );
  expect(contextBridge.exposeInMainWorld).toHaveBeenNthCalledWith(
    4,
    "API",
    APISetup,
  );
  expect(contextBridge.exposeInMainWorld).toHaveBeenNthCalledWith(
    5,
    "API",
    APISetup,
  );
});
