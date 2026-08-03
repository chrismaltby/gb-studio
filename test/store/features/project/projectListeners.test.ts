import {
  configureStore,
  createListenerMiddleware,
  type ThunkDispatch,
  type UnknownAction,
} from "@reduxjs/toolkit";
import API from "renderer/lib/api";
import { createSong } from "shared/lib/uge/song";
import projectActions from "store/features/project/projectActions";
import { registerProjectListeners } from "store/features/project/projectListeners";
import rootReducer from "store/rootReducer";
import type { RootState } from "store/storeTypes";
import { dummyMusic, dummyRootState } from "../../../dummydata";

const flushPromises = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

const setupProjectListeners = () => {
  const state: RootState = {
    ...dummyRootState,
    tracker: {
      ...dummyRootState.tracker,
      modified: true,
    },
    trackerDocument: {
      ...dummyRootState.trackerDocument,
      present: {
        ...dummyRootState.trackerDocument.present,
        song: createSong(),
      },
    },
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
                filename: "old.uge",
                type: "uge",
              },
            },
          },
        },
      },
    },
  };
  const listenerMiddleware = createListenerMiddleware<
    RootState,
    ThunkDispatch<RootState, unknown, UnknownAction>
  >();
  registerProjectListeners(listenerMiddleware.startListening);

  return configureStore({
    reducer: rootReducer,
    preloadedState: state,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: false,
        serializableCheck: false,
      }).prepend(listenerMiddleware.middleware),
  });
};

afterEach(() => {
  jest.restoreAllMocks();
});

test("Should save a modified song before renaming it", async () => {
  const save = jest.spyOn(API.tracker, "saveUGEFile").mockResolvedValue();
  const rename = jest.spyOn(API.project, "renameAsset").mockResolvedValue(true);
  const store = setupProjectListeners();

  store.dispatch(
    projectActions.renameMusicAsset({
      musicId: "music1",
      newFilename: "renamed",
    }),
  );
  await flushPromises();

  expect(save).toHaveBeenCalledTimes(1);
  expect(rename).toHaveBeenCalledWith(
    "music",
    expect.objectContaining({ id: "music1", filename: "old.uge" }),
    "renamed.uge",
  );
  expect(save.mock.invocationCallOrder[0]).toBeLessThan(
    rename.mock.invocationCallOrder[0],
  );
});

test("Should not rename a modified song when saving fails", async () => {
  jest.spyOn(console, "log").mockImplementation();
  jest.spyOn(API.tracker, "saveUGEFile").mockRejectedValue(new Error("Failed"));
  const rename = jest.spyOn(API.project, "renameAsset");
  const store = setupProjectListeners();

  store.dispatch(
    projectActions.renameMusicAsset({
      musicId: "music1",
      newFilename: "renamed",
    }),
  );
  await flushPromises();

  expect(rename).not.toHaveBeenCalled();
});
