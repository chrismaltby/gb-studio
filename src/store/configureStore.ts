import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./rootReducer";
import electronMiddleware from "./features/electron/electronMiddleware";
import musicMiddleware from "./features/music/musicMiddleware";
import soundFxMiddleware from "./features/soundfx/soundfxMiddleware";
import assetsMiddleware from "./features/assets/assetsMiddleware";
import clipboardMiddleware from "./features/clipboard/clipboardMiddleware";
import projectMiddleware from "./features/project/projectMiddleware";
import spriteMiddleware from "./features/sprite/spriteMiddleware";
import throttleMiddleware from "./features/throttle/throttleMiddleware";
import trackerDocumentMiddleware from "./features/trackerDocument/trackerDocumentMiddleware";
import entitiesMiddleware from "./features/entities/entitiesMiddleware";
import settingsMiddleware from "./features/settings/settingsMiddleware";
import consoleMiddleware from "./features/console/consoleMiddleware";
import listenerMiddleware from "./listenerMiddleware";

const store = configureStore({
  reducer: rootReducer,
  devTools: {
    latency: 200,
    actionsDenylist: ["editor/sceneHover", "tracker/setHover"],
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    })
      .prepend(listenerMiddleware.middleware)
      .concat([
        throttleMiddleware,
        electronMiddleware,
        projectMiddleware,
        entitiesMiddleware,
        settingsMiddleware,
        spriteMiddleware,
        musicMiddleware,
        soundFxMiddleware,
        assetsMiddleware,
        consoleMiddleware,
        clipboardMiddleware,
        trackerDocumentMiddleware,
      ]),
});

export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
export type AppState = ReturnType<typeof store.getState>;
export type { RootState, AppThunk } from "./storeTypes";

export default store;
