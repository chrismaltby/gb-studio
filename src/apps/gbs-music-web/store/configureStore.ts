import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import rootReducer from "./rootReducer";
import backupMusicMiddleware from "gbs-music-web/store/backupMusicMiddleware";
import { registerProjectListeners } from "gbs-music-web/store/projectListeners";

export type MusicEditorRootState = ReturnType<typeof rootReducer>;

export const createMusicEditorStore = () => {
  const listenerMiddleware = createListenerMiddleware<MusicEditorRootState>();
  registerProjectListeners(listenerMiddleware.startListening);

  return configureStore({
    reducer: rootReducer,
    devTools: {
      latency: 200,
      actionsDenylist: ["tracker/setHover"],
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      })
        .prepend(listenerMiddleware.middleware)
        .concat([backupMusicMiddleware]),
  });
};

export type MusicEditorStore = ReturnType<typeof createMusicEditorStore>;
