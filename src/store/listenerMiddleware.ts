import {
  createListenerMiddleware,
  type ThunkDispatch,
  type UnknownAction,
} from "@reduxjs/toolkit";
import { registerBuildLogListeners } from "store/features/buildGame/buildLogListeners";
import { registerClipboardListeners } from "store/features/clipboard/clipboardListeners";
import { registerMusicListeners } from "store/features/music/musicListeners";
import { registerProjectListeners } from "store/features/project/projectListeners";
import { registerSpriteListeners } from "store/features/sprite/spriteListeners";
import { registerUndoListeners } from "store/features/undo/undoListeners";
import type { RootState } from "store/storeTypes";

type AppDispatch = ThunkDispatch<RootState, unknown, UnknownAction>;

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>();

registerBuildLogListeners(listenerMiddleware.startListening);
registerClipboardListeners(listenerMiddleware.startListening);
registerMusicListeners(listenerMiddleware.startListening);
registerProjectListeners(listenerMiddleware.startListening);
registerSpriteListeners(listenerMiddleware.startListening);
registerUndoListeners(listenerMiddleware.startListening);

export default listenerMiddleware;
