import {
  configureStore,
  createListenerMiddleware,
  type Middleware,
  type UnknownAction,
} from "@reduxjs/toolkit";
import API from "renderer/lib/api";
import musicActions from "store/features/music/musicActions";
import { registerMusicListeners } from "store/features/music/musicListeners";
import navigationActions from "store/features/navigation/navigationActions";
import type { RootState } from "store/storeTypes";
import { dummyMusic, dummyRootState } from "../../../dummydata";

const setupMusicListeners = (
  type: "uge" | "mod" = "uge",
  disableSpeedConversion = false,
) => {
  const actions: UnknownAction[] = [];
  const listenerMiddleware = createListenerMiddleware<RootState>();
  registerMusicListeners(listenerMiddleware.startListening);
  const extension = type === "uge" ? "uge" : "mod";
  const state: RootState = {
    ...dummyRootState,
    project: {
      ...dummyRootState.project,
      present: {
        ...dummyRootState.project.present,
        entities: {
          ...dummyRootState.project.present.entities,
          music: {
            ids: ["music1"],
            entities: {
              music1: {
                ...dummyMusic,
                id: "music1",
                filename: `song.${extension}`,
                type,
                settings: {
                  disableSpeedConversion,
                },
              },
            },
          },
        },
      },
    },
  };
  const captureActions: Middleware = () => (next) => (action) => {
    actions.push(action as UnknownAction);
    return next(action);
  };
  const store = configureStore({
    reducer: () => state,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: false,
        serializableCheck: false,
      })
        .prepend(listenerMiddleware.middleware)
        .concat(captureActions),
  });

  return { actions, store };
};

afterEach(() => {
  jest.restoreAllMocks();
});

test("Should play a UGE track", () => {
  const playUGE = jest.spyOn(API.music, "playUGE");
  const { store } = setupMusicListeners();

  store.dispatch(musicActions.playMusic({ musicId: "music1" }));

  expect(playUGE).toHaveBeenCalledWith("assets/music/song.uge");
});

test.each([
  [false, true],
  [true, false],
])(
  "Should play a MOD track with disableSpeedConversion=%s",
  (disableSpeedConversion, expectedSpeedConversion) => {
    const playMOD = jest.spyOn(API.music, "playMOD");
    const { store } = setupMusicListeners("mod", disableSpeedConversion);

    store.dispatch(musicActions.playMusic({ musicId: "music1" }));

    expect(playMOD).toHaveBeenCalledWith(
      "assets/music/song.mod",
      expectedSpeedConversion,
    );
  },
);

test("Should not play a missing track", () => {
  const playUGE = jest.spyOn(API.music, "playUGE");
  const playMOD = jest.spyOn(API.music, "playMOD");
  const { store } = setupMusicListeners();

  store.dispatch(musicActions.playMusic({ musicId: "missing" }));

  expect(playUGE).not.toHaveBeenCalled();
  expect(playMOD).not.toHaveBeenCalled();
});

test("Should close music when paused", () => {
  const closeMusic = jest.spyOn(API.music, "closeMusic");
  const { store } = setupMusicListeners();

  store.dispatch(musicActions.pauseMusic());

  expect(closeMusic).toHaveBeenCalledTimes(1);
});

test.each([
  navigationActions.setSection("settings"),
  navigationActions.setNavigationId("navigator"),
])("Should pause music after $type", (action) => {
  const { actions, store } = setupMusicListeners();

  store.dispatch(action);

  expect(actions).toContainEqual(musicActions.pauseMusic());
});
