import { createListenerMiddleware } from "@reduxjs/toolkit";
import { registerBuildLogListeners } from "store/features/buildGame/buildLogListeners";
import { registerUndoListeners } from "store/features/undo/undoListeners";
import type { RootState } from "store/storeTypes";

const listenerMiddleware = createListenerMiddleware<RootState>();

registerBuildLogListeners(listenerMiddleware.startListening);
registerUndoListeners(listenerMiddleware.startListening);

export default listenerMiddleware;
