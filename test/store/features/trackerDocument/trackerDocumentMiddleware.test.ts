import {
  configureStore,
  type Middleware,
  type UnknownAction,
} from "@reduxjs/toolkit";
import API from "renderer/lib/api";
import { createSong } from "shared/lib/uge/song";
import electronActions from "store/features/electron/electronActions";
import navigationActions from "store/features/navigation/navigationActions";
import trackerActions from "store/features/tracker/trackerActions";
import trackerReducer from "store/features/tracker/trackerState";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import trackerDocumentMiddleware from "store/features/trackerDocument/trackerDocumentMiddleware";
import {
  requestAddNewSongFile,
  saveSongFile,
} from "store/features/trackerDocument/trackerDocumentState";
import type { RootState } from "store/storeTypes";
import { dummyMusic, dummyRootState } from "../../../dummydata";

const setupTrackerDocumentMiddleware = (modified = true) => {
  const actions: UnknownAction[] = [];
  const initialState: RootState = {
    ...dummyRootState,
    tracker: {
      ...dummyRootState.tracker,
      modified,
      selectedSongId: "song1",
    },
    trackerDocument: {
      ...dummyRootState.trackerDocument,
      present: {
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
            ids: ["song1"],
            entities: {
              song1: {
                ...dummyMusic,
                id: "song1",
                name: "Test Song",
              },
            },
          },
        },
      },
    },
  };
  const reducer = (state = initialState, action: UnknownAction): RootState => {
    return {
      ...state,
      tracker: trackerReducer(state.tracker, action),
    };
  };
  const captureActions: Middleware = () => (next) => (action) => {
    actions.push(action as UnknownAction);
    return next(action);
  };
  const store = configureStore({
    reducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: false,
        serializableCheck: false,
      }).concat(trackerDocumentMiddleware, captureActions),
  });

  return { actions, store };
};

afterEach(() => {
  jest.restoreAllMocks();
});

test("Should save before continuing with an action that leaves the music editor", async () => {
  jest
    .spyOn(API.dialog, "confirmUnsavedChangesTrackerDialog")
    .mockResolvedValue(0);
  const save = jest.spyOn(API.tracker, "saveUGEFile").mockResolvedValue();
  const { actions, store } = setupTrackerDocumentMiddleware();
  const action = navigationActions.setSection("world");

  const result = await store.dispatch(action);

  expect(result).toBe(action);
  expect(save).toHaveBeenCalledTimes(1);
  expect(actions.map(({ type }) => type)).toEqual([
    saveSongFile.pending.type,
    saveSongFile.fulfilled.type,
    action.type,
  ]);
});

test("Should unload without saving before continuing when changes are discarded", async () => {
  jest
    .spyOn(API.dialog, "confirmUnsavedChangesTrackerDialog")
    .mockResolvedValue(1);
  const save = jest.spyOn(API.tracker, "saveUGEFile");
  const { actions, store } = setupTrackerDocumentMiddleware();
  const action = navigationActions.setSection("world");

  await store.dispatch(action);

  expect(save).not.toHaveBeenCalled();
  expect(actions).toEqual([trackerDocumentActions.unloadSong(), action]);
});

test("Should not continue when leaving the music editor is cancelled", async () => {
  jest
    .spyOn(API.dialog, "confirmUnsavedChangesTrackerDialog")
    .mockResolvedValue(2);
  const { actions, store } = setupTrackerDocumentMiddleware();

  await store.dispatch(navigationActions.setSection("world"));

  expect(actions).toEqual([]);
});

test("Should guard selecting a different song", async () => {
  const confirm = jest
    .spyOn(API.dialog, "confirmUnsavedChangesTrackerDialog")
    .mockResolvedValue(2);
  const { actions, store } = setupTrackerDocumentMiddleware();

  await store.dispatch(trackerActions.setSelectedSongId("song2"));

  expect(confirm).toHaveBeenCalledWith("Test Song");
  expect(actions).toEqual([]);
});

test("Should add a requested song after changes are discarded", async () => {
  jest
    .spyOn(API.dialog, "confirmUnsavedChangesTrackerDialog")
    .mockResolvedValue(1);
  const addNewSong = jest
    .spyOn(API.tracker, "addNewUGEFile")
    .mockResolvedValue({
      ...dummyMusic,
      _resourceType: "music",
      id: "song2",
      filename: "song2.uge",
    });
  const { store } = setupTrackerDocumentMiddleware();

  await store.dispatch(requestAddNewSongFile("song2.uge"));

  expect(addNewSong).toHaveBeenCalledWith("song2.uge");
});

test("Should not continue when saving changes fails", async () => {
  jest.spyOn(console, "log").mockImplementation();
  jest
    .spyOn(API.dialog, "confirmUnsavedChangesTrackerDialog")
    .mockResolvedValue(0);
  jest.spyOn(API.tracker, "saveUGEFile").mockRejectedValue(new Error("Failed"));
  const { actions, store } = setupTrackerDocumentMiddleware();
  const action = navigationActions.setSection("world");

  await store.dispatch(action);

  expect(actions.map(({ type }) => type)).toEqual([
    saveSongFile.pending.type,
    electronActions.showErrorBox.type,
    saveSongFile.rejected.type,
  ]);
  expect(actions).not.toContainEqual(action);
});

test("Should immediately continue when the tracker document is unmodified", () => {
  const confirm = jest.spyOn(API.dialog, "confirmUnsavedChangesTrackerDialog");
  const { actions, store } = setupTrackerDocumentMiddleware(false);
  const action = navigationActions.setSection("world");

  const result = store.dispatch(action);

  expect(result).toBe(action);
  expect(confirm).not.toHaveBeenCalled();
  expect(actions).toEqual([action]);
});
