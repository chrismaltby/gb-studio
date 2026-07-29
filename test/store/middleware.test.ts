/**
 * @jest-environment jsdom
 */

import type { Dispatch, Middleware, MiddlewareAPI } from "@reduxjs/toolkit";
import assetsMiddleware from "store/features/assets/assetsMiddleware";
import consoleMiddleware from "store/features/console/consoleMiddleware";
import electronMiddleware from "store/features/electron/electronMiddleware";
import entitiesMiddleware from "store/features/entities/entitiesMiddleware";
import settingsMiddleware from "store/features/settings/settingsMiddleware";
import soundfxMiddleware from "store/features/soundfx/soundfxMiddleware";
import throttleMiddleware from "store/features/throttle/throttleMiddleware";
import trackerDocumentMiddleware from "store/features/trackerDocument/trackerDocumentMiddleware";
import type { RootState } from "store/storeTypes";

jest.mock("store/features/clipboard/clipboardHelpers", () => ({
  pasteAny: jest.fn(),
  rawCopy: jest.fn(),
}));

const appMiddleware: Array<[string, Middleware]> = [
  ["throttle", throttleMiddleware],
  ["electron", electronMiddleware],
  ["entities", entitiesMiddleware],
  ["settings", settingsMiddleware],
  ["sound effects", soundfxMiddleware],
  ["assets", assetsMiddleware],
  ["console", consoleMiddleware],
  ["tracker document", trackerDocumentMiddleware],
];

const makeStore = (state: Partial<RootState> = {}) =>
  ({
    getState: () => ({
      ...state,
    }),
    dispatch: jest.fn(),
  }) as unknown as MiddlewareAPI<Dispatch, RootState>;

describe.each(appMiddleware)("%s middleware", (_name, middleware) => {
  it("forwards an unmatched action exactly once and returns next's value", () => {
    const store = makeStore();
    const downstreamResult = {};
    const next = jest.fn((_action: unknown) => downstreamResult);
    const action = { type: "test/unmatched" };

    const result = middleware(store)(next)(action);

    expect(result).toBe(downstreamResult);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]?.[0]).toBe(action);
  });
});

describe("electron middleware entity removal actions", () => {
  it.each([
    {
      type: "entities/removeVariable",
      payload: { variableId: "variable-1" },
    },
    {
      type: "entities/removeConstant",
      payload: { constantId: "constant-1" },
    },
    {
      type: "entities/removeCustomEvent",
      payload: { customEventId: "script-1", deleteReferences: false },
    },
  ])("forwards $type synchronously", (action) => {
    const store = makeStore();
    const downstreamResult = {};
    const next = jest.fn(() => downstreamResult);

    const result = electronMiddleware(store)(next)(action);

    expect(result).toBe(downstreamResult);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(action);
  });
});
