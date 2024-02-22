import { mocked } from "ts-jest/utils";
import middleware from "../../../../src/store/features/assets/assetsMiddleware";
import actions from "../../../../src/store/features/assets/assetsActions";
import { RootState } from "../../../../src/store/configureStore";
import { dummyBackground } from "../../../dummydata";
import { MiddlewareAPI, Dispatch, AnyAction } from "@reduxjs/toolkit";
import { getBackgroundInfo } from "../../../../src/lib/helpers/validation";

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

jest.mock("../../../../src/lib/helpers/validation");
const mockedGetBackgroundWarnings = mocked(getBackgroundInfo, true);

test("Should trigger call to check background assets", async () => {
  mockedGetBackgroundWarnings.mockClear();
  mockedGetBackgroundWarnings.mockResolvedValue({
    numTiles: 10,
    warnings: ["Warning 1"],
    lookup: new Uint8Array(),
  });

  const store = {
    getState: () => ({
      document: {
        root: "/root/path/",
      },
      assets: {
        backgrounds: {},
      },
      project: {
        present: {
          entities: {
            backgrounds: {
              entities: {
                bg1: {
                  ...dummyBackground,
                  id: "bg1",
                },
              },
              ids: ["bg1"],
            },
          },
        },
      },
    }),
    dispatch: jest.fn(),
  } as unknown as MiddlewareAPI<Dispatch<AnyAction>, RootState>;

  const next = jest.fn();
  const action = actions.loadBackgroundAssetInfo({
    backgroundId: "bg1",
    is360: false,
  });

  middleware(store)(next)(action);

  await flushPromises();

  expect(mockedGetBackgroundWarnings).toHaveBeenCalled();
  expect(store.dispatch).toHaveBeenCalledWith(
    actions.setBackgroundAssetInfo({
      id: "bg1",
      numTiles: 10,
      is360: false,
      warnings: ["Warning 1"],
      lookup: new Uint8Array(),
    })
  );
});

test("Should not trigger call to check background assets if already cached assets", async () => {
  mockedGetBackgroundWarnings.mockClear();
  mockedGetBackgroundWarnings.mockResolvedValue({
    numTiles: 10,
    warnings: ["Warning 1"],
    lookup: new Uint8Array(),
  });

  const store = {
    getState: () => ({
      document: {
        root: "/root/path/",
      },
      assets: {
        backgrounds: {
          bg1: {
            id: "bg1",
            assets: ["Warning 2"],
            is360: false,
            timestamp: 100,
          },
        },
      },
      project: {
        present: {
          entities: {
            backgrounds: {
              entities: {
                bg1: {
                  ...dummyBackground,
                  id: "bg1",
                  _v: 0,
                },
              },
              ids: ["bg1"],
            },
          },
        },
      },
    }),
    dispatch: jest.fn(),
  } as unknown as MiddlewareAPI<Dispatch<AnyAction>, RootState>;

  const next = jest.fn();
  const action = actions.loadBackgroundAssetInfo({
    backgroundId: "bg1",
    is360: false,
  });

  middleware(store)(next)(action);

  await flushPromises();

  expect(mockedGetBackgroundWarnings).not.toHaveBeenCalled();
  expect(store.dispatch).not.toHaveBeenCalled();
});

test("Should trigger call to check background assets if cache has expired", async () => {
  mockedGetBackgroundWarnings.mockClear();
  mockedGetBackgroundWarnings.mockResolvedValue({
    numTiles: 10,
    warnings: ["Warning 1"],
    lookup: new Uint8Array(),
  });

  const store = {
    getState: () => ({
      document: {
        root: "/root/path/",
      },
      assets: {
        backgrounds: {
          bg1: {
            id: "bg1",
            assets: ["Warning 2"],
            timestamp: 100,
          },
        },
      },
      project: {
        present: {
          entities: {
            backgrounds: {
              entities: {
                bg1: {
                  ...dummyBackground,
                  id: "bg1",
                  _v: 101,
                },
              },
              ids: ["bg1"],
            },
          },
        },
      },
    }),
    dispatch: jest.fn(),
  } as unknown as MiddlewareAPI<Dispatch<AnyAction>, RootState>;

  const next = jest.fn();
  const action = actions.loadBackgroundAssetInfo({
    backgroundId: "bg1",
    is360: false,
  });

  middleware(store)(next)(action);

  await flushPromises();

  expect(mockedGetBackgroundWarnings).toHaveBeenCalled();
  expect(store.dispatch).toHaveBeenCalledWith(
    actions.setBackgroundAssetInfo({
      id: "bg1",
      numTiles: 10,
      is360: false,
      warnings: ["Warning 1"],
      lookup: new Uint8Array(),
    })
  );
});
