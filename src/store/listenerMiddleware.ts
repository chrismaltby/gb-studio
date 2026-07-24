import { createListenerMiddleware } from "@reduxjs/toolkit";
import { registerBuildLogListeners } from "store/features/buildGame/buildLogListeners";
import { registerClipboardListeners } from "store/features/clipboard/clipboardListeners";
import { registerSpriteListeners } from "store/features/sprite/spriteListeners";
import { registerUndoListeners } from "store/features/undo/undoListeners";
import type { RootState } from "store/storeTypes";

const listenerMiddleware = createListenerMiddleware<RootState>();

registerBuildLogListeners(listenerMiddleware.startListening);
registerClipboardListeners(listenerMiddleware.startListening);
registerSpriteListeners(listenerMiddleware.startListening);
registerUndoListeners(listenerMiddleware.startListening);

export default listenerMiddleware;
