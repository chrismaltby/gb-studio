/**
 * @jest-environment jsdom
 */

import actions from "../../../../src/store/features/music/musicActions";
import navigationActions from "../../../../src/store/features/navigation/navigationActions";
import { RootState } from "../../../../src/store/configureStore";
import { dummyBackground, dummyMusic } from "../../../dummydata";
import { MiddlewareAPI, Dispatch, UnknownAction } from "@reduxjs/toolkit";
import ScripTracker from "../../../../src/renderer/lib/vendor/scriptracker/scriptracker";
import middleware, {
  initMusic,
} from "../../../../src/store/features/music/musicMiddleware";
jest.mock("../../../../src/renderer/lib/vendor/scriptracker/scriptracker");
const mockedScripTracker = jest.mocked(ScripTracker);

beforeEach(() => {
  jest.resetModules();
});

test("Should trigger call to play music", async () => {
  mockedScripTracker.mockClear();

  const modPlayer = initMusic();

  const loadSpy = jest.spyOn(modPlayer, "loadModule");

  const store = {
    getState: () => ({
      document: {
        root: "/root/path/",
      },
      music: {
        backgrounds: {},
      },
      project: {
        present: {
          entities: {
            music: {
              entities: {
                track1: {
                  ...dummyMusic,
                  id: "track1",
                  filename: "track1.mod",
                },
              },
              ids: ["track1"],
            },
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
  } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;

  const next = jest.fn();
  const action = actions.playMusic({ musicId: "track1" });

  middleware(store)(next)(action);

  expect(loadSpy).toBeCalledWith(
    "gbs://project/assets/music/track1.mod",
    false,
  );
});

test("Should trigger a call to pause music", async () => {
  mockedScripTracker.mockClear();

  const modPlayer = initMusic();

  Object.defineProperty(modPlayer, "isPlaying", {
    get: jest.fn(() => true),
    set: jest.fn(),
  });

  const stopSpy = jest.spyOn(modPlayer, "stop");

  const store = {
    getState: () => ({
      document: {
        root: "/root/path/",
      },
      music: {
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
  } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;

  const next = jest.fn();
  const action = actions.pauseMusic();

  middleware(store)(next)(action);

  expect(stopSpy).toBeCalledWith();
});

test("Should pause music when switching section", async () => {
  const store = {
    getState: () => ({
      editor: {
        section: "world",
      },
    }),
    dispatch: jest.fn(),
  } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;

  const next = jest.fn();
  const action = navigationActions.setSection("settings");

  middleware(store)(next)(action);

  expect(store.dispatch).toBeCalledWith(actions.pauseMusic());
});
