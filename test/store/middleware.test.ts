/**
 * @jest-environment jsdom
 */

import type { Dispatch, Middleware, MiddlewareAPI } from "@reduxjs/toolkit";
import assetsMiddleware from "store/features/assets/assetsMiddleware";
import buildGameMiddleware from "store/features/buildGame/buildGameMiddleware";
import clipboardMiddleware from "store/features/clipboard/clipboardMiddleware";
import consoleMiddleware from "store/features/console/consoleMiddleware";
import electronMiddleware from "store/features/electron/electronMiddleware";
import entitiesMiddleware from "store/features/entities/entitiesMiddleware";
import musicMiddleware from "store/features/music/musicMiddleware";
import projectMiddleware from "store/features/project/projectMiddleware";
import settingsMiddleware from "store/features/settings/settingsMiddleware";
import soundfxMiddleware from "store/features/soundfx/soundfxMiddleware";
import spriteMiddleware from "store/features/sprite/spriteMiddleware";
import throttleMiddleware from "store/features/throttle/throttleMiddleware";
import trackerDocumentMiddleware from "store/features/trackerDocument/trackerDocumentMiddleware";
import undoMiddleware from "store/features/undo/undoMiddleware";
import type { RootState } from "store/storeTypes";

jest.mock("components/world/inspector/constants/ConstantInspector", () => ({
  worker: {
    addEventListener: jest.fn(),
    postMessage: jest.fn(),
  },
}));

jest.mock("store/features/clipboard/clipboardHelpers", () => ({
  pasteAny: jest.fn(),
  rawCopy: jest.fn(),
}));

const appMiddleware: Array<[string, Middleware]> = [
  ["throttle", throttleMiddleware],
  ["electron", electronMiddleware],
  ["project", projectMiddleware],
  ["entities", entitiesMiddleware],
  ["settings", settingsMiddleware],
  ["sprite", spriteMiddleware],
  ["build game", buildGameMiddleware],
  ["clipboard", clipboardMiddleware],
  ["music", musicMiddleware],
  ["sound effects", soundfxMiddleware],
  ["assets", assetsMiddleware],
  ["console", consoleMiddleware],
  ["undo", undoMiddleware],
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
