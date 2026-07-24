import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import { renameWebDocument } from "gbs-music-web/lib/adapters";
import { musicAssetActions } from "gbs-music-web/store/features/musicAssets/musicAssetsState";
import { registerProjectListeners } from "gbs-music-web/store/projectListeners";
import rootReducer from "gbs-music-web/store/rootReducer";
import type { MusicAsset } from "shared/lib/resources/types";
import { createSong } from "shared/lib/uge/song";
import projectActions from "store/features/project/projectActions";
import trackerActions from "store/features/tracker/trackerActions";
import { loadSongFile } from "store/features/trackerDocument/trackerDocumentState";

jest.mock("gbs-music-web/lib/adapters", () => ({
  renameWebDocument: jest.fn(),
}));

const flushPromises = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

const setupStore = (type: MusicAsset["type"] = "uge") => {
  const listenerMiddleware =
    createListenerMiddleware<ReturnType<typeof rootReducer>>();
  registerProjectListeners(listenerMiddleware.startListening);
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: false,
        serializableCheck: false,
      }).prepend(listenerMiddleware.middleware),
  });
  const extension = type === "uge" ? "uge" : "mod";
  store.dispatch(
    musicAssetActions.setMusicAssets([
      {
        id: "music1",
        name: "old",
        symbol: "song_0",
        filename: `old.${extension}`,
        inode: "1",
        _v: 0,
        type,
        settings: {},
      },
    ]),
  );

  return store;
};

beforeEach(() => {
  jest.mocked(renameWebDocument).mockResolvedValue({
    id: "music1",
    name: "renamed",
    filename: "renamed.uge",
    format: "uge",
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

test("Should sanitise and rename the asset and selected tracker document", async () => {
  const store = setupStore();
  store.dispatch(trackerActions.setSelectedSongId("music1"));
  store.dispatch(
    loadSongFile.fulfilled(
      {
        ...createSong(),
        filename: "old.uge",
      },
      "requestId",
      "old.uge",
    ),
  );

  store.dispatch(
    projectActions.renameMusicAsset({
      musicId: "music1",
      newFilename: " /new\\name/ ",
    }),
  );
  await flushPromises();

  expect(renameWebDocument).toHaveBeenCalledWith(
    "music1",
    "old.uge",
    "newname.uge",
  );
  expect(
    store.getState().project.present.entities.music.entities.music1?.filename,
  ).toBe("newname.uge");
  expect(store.getState().trackerDocument.present.song?.filename).toBe(
    "newname.uge",
  );
});

test("Should preserve the existing music format extension", async () => {
  const store = setupStore("mod");

  store.dispatch(
    projectActions.renameMusicAsset({
      musicId: "music1",
      newFilename: "renamed",
    }),
  );
  await flushPromises();

  expect(renameWebDocument).toHaveBeenCalledWith(
    "music1",
    "old.mod",
    "renamed.mod",
  );
});

test.each([
  ["a blank name", " /\\  "],
  ["the unchanged name", "old"],
])("Should ignore %s", async (_description, newFilename) => {
  const store = setupStore();

  store.dispatch(
    projectActions.renameMusicAsset({
      musicId: "music1",
      newFilename,
    }),
  );
  await flushPromises();

  expect(renameWebDocument).not.toHaveBeenCalled();
  expect(
    store.getState().project.present.entities.music.entities.music1?.filename,
  ).toBe("old.uge");
});
