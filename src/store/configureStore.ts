import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./rootReducer";
import electronMiddleware from "./features/electron/electronMiddleware";
import buildGameMiddleware from "./features/buildGame/buildGameMiddleware";
import musicMiddleware from "./features/music/musicMiddleware";
import soundFxMiddleware from "./features/soundfx/soundfxMiddleware";
import assetsMiddleware from "./features/assets/assetsMiddleware";
import undoMiddleware from "./features/undo/undoMiddleware";
import clipboardMiddleware from "./features/clipboard/clipboardMiddleware";
import projectMiddleware from "./features/project/projectMiddleware";
import spriteMiddleware from "./features/sprite/spriteMiddleware";
import throttleMiddleware from "./features/throttle/throttleMiddleware";
import trackerDocumentMiddleware from "./features/trackerDocument/trackerDocumentMiddleware";
import entitiesMiddleware from "./features/entities/entitiesMiddleware";
import settingsMiddleware from "./features/settings/settingsMiddleware";
import consoleMiddleware from "./features/console/consoleMiddleware";

export type RootState = ReturnType<typeof rootReducer>;

const store = configureStore({
  reducer: rootReducer,
  devTools: {
    latency: 200,
    actionsDenylist: ["editor/sceneHover"],
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }).concat([
      throttleMiddleware,
      electronMiddleware,
      projectMiddleware,
      entitiesMiddleware,
      settingsMiddleware,
      spriteMiddleware,
      buildGameMiddleware,
      musicMiddleware,
      soundFxMiddleware,
      assetsMiddleware,
      consoleMiddleware,
      undoMiddleware,
      clipboardMiddleware,
      trackerDocumentMiddleware,
    ]),
});

export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;

export default store;
