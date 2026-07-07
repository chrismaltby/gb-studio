import middleware from "../../../../src/store/features/assets/assetsMiddleware";
import actions from "../../../../src/store/features/assets/assetsActions";
import { RootState } from "store/storeTypes";
import { dummyBackground } from "../../../dummydata";
import { MiddlewareAPI, Dispatch, UnknownAction } from "@reduxjs/toolkit";
import API from "../../../__mocks__/apiMock";

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

jest.mock("../../../__mocks__/apiMock");

const mockedAPI = jest.mocked(API);
const mockedGetBackgroundInfo = mockedAPI.project.getBackgroundInfo;
const mockedGetSceneTilemapInfo = mockedAPI.project.getSceneTilemapInfo;

test("Should debounce scene tilemap asset checks", async () => {
  jest.useFakeTimers();
  mockedGetSceneTilemapInfo.mockClear();
  mockedGetSceneTilemapInfo.mockResolvedValue({ numTiles: 12, warnings: [] });
  const scene = { id: "scene1", tilemap: { tilesets: [], layers: [] } };
  const store = {
    getState: () => ({
      project: {
        present: {
          entities: {
            scenes: { entities: { scene1: scene }, ids: ["scene1"] },
            tilesets: { entities: {}, ids: [] },
          },
          settings: { colorMode: "mono", autoTileFlipEnabled: false },
        },
      },
    }),
    dispatch: jest.fn(),
  } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;
  const next = jest.fn();
  const action = actions.loadSceneTilemapAssetInfo({ sceneId: "scene1" });

  middleware(store)(next)(action);
  middleware(store)(next)(action);
  expect(mockedGetSceneTilemapInfo).not.toHaveBeenCalled();
  jest.advanceTimersByTime(750);
  await Promise.resolve();

  expect(mockedGetSceneTilemapInfo).toHaveBeenCalledTimes(1);
  expect(store.dispatch).toHaveBeenCalledWith(
    actions.setSceneTilemapAssetInfo({
      sceneId: "scene1",
      numTiles: 12,
      warnings: [],
    }),
  );
  jest.useRealTimers();
});

test("Should trigger call to check background assets", async () => {
  mockedGetBackgroundInfo.mockClear();
  mockedGetBackgroundInfo.mockResolvedValue({
    numTiles: 10,
    warnings: ["Warning 1"],
    lookup: [],
    attr: [],
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
            tilesets: {
              entities: {},
            },
            palettes: {
              entities: {},
            },
          },
          settings: {
            colorMode: "mono",
            defaultBackgroundPaletteIds: [],
          },
        },
      },
    }),
    dispatch: jest.fn(),
  } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;

  const next = jest.fn();
  const action = actions.loadBackgroundAssetInfo({
    backgroundId: "bg1",
    is360: false,
    uiPaletteId: "",
    colorMode: "mixed",
  });

  middleware(store)(next)(action);

  await flushPromises();

  expect(mockedGetBackgroundInfo).toHaveBeenCalled();
  expect(store.dispatch).toHaveBeenCalledWith(
    actions.setBackgroundAssetInfo({
      id: "bg1",
      numTiles: 10,
      is360: false,
      isCGBOnly: false,
      warnings: ["Warning 1"],
      lookup: [],
      autoPalettes: undefined,
      tilesetId: undefined,
      hash: "0_false__mixed_undefined_undefined_undefined_undefined_undefined",
    }),
  );
});

test("Should not trigger call to check background assets if already cached assets", async () => {
  mockedGetBackgroundInfo.mockClear();
  mockedGetBackgroundInfo.mockResolvedValue({
    numTiles: 10,
    warnings: ["Warning 1"],
    lookup: [],
    attr: [],
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
            isCGBOnly: false,
            timestamp: 100,
            hash: "0_false__mixed_undefined_undefined_undefined_undefined_undefined",
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
            tilesets: {
              entities: {},
            },
            palettes: {
              entities: {},
            },
          },
          settings: {
            colorMode: "mono",
            defaultBackgroundPaletteIds: [],
          },
        },
      },
    }),
    dispatch: jest.fn(),
  } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;

  const next = jest.fn();
  const action = actions.loadBackgroundAssetInfo({
    backgroundId: "bg1",
    is360: false,
    uiPaletteId: "",
    colorMode: "mixed",
  });

  middleware(store)(next)(action);

  await flushPromises();

  expect(mockedGetBackgroundInfo).not.toHaveBeenCalled();
  expect(store.dispatch).not.toHaveBeenCalled();
});

test("Should trigger call to check background assets if cache has expired", async () => {
  mockedGetBackgroundInfo.mockClear();
  mockedGetBackgroundInfo.mockResolvedValue({
    numTiles: 10,
    warnings: ["Warning 1"],
    lookup: [],
    attr: [],
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
            tilesets: {
              entities: {},
            },
            palettes: {
              entities: {},
            },
          },
          settings: {
            colorMode: "mono",
            defaultBackgroundPaletteIds: [],
          },
        },
      },
    }),
    dispatch: jest.fn(),
  } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;

  const next = jest.fn();
  const action = actions.loadBackgroundAssetInfo({
    backgroundId: "bg1",
    is360: false,
    uiPaletteId: "",
    colorMode: "mixed",
  });

  middleware(store)(next)(action);

  await flushPromises();

  expect(mockedGetBackgroundInfo).toHaveBeenCalled();
  expect(store.dispatch).toHaveBeenCalledWith(
    actions.setBackgroundAssetInfo({
      id: "bg1",
      numTiles: 10,
      is360: false,
      isCGBOnly: false,
      warnings: ["Warning 1"],
      lookup: [],
      hash: "101_false__mixed_undefined_undefined_undefined_undefined_undefined",
    }),
  );
});
