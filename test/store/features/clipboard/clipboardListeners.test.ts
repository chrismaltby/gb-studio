/**
 * @jest-environment jsdom
 */

import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import { registerClipboardListeners } from "store/features/clipboard/clipboardListeners";
import editorActions from "store/features/editor/editorActions";
import type { RootState } from "store/storeTypes";

test("Should clear browser text selection after selecting an editor entity", () => {
  const removeAllRanges = jest.fn();
  jest.spyOn(window, "getSelection").mockReturnValue({
    removeAllRanges,
  } as unknown as Selection);
  const listenerMiddleware = createListenerMiddleware<RootState>();
  registerClipboardListeners(listenerMiddleware.startListening);
  const store = configureStore({
    reducer: () => ({}) as RootState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: false,
        serializableCheck: false,
      }).prepend(listenerMiddleware.middleware),
  });

  store.dispatch(editorActions.selectScene({ sceneId: "scene1" }));

  expect(removeAllRanges).toHaveBeenCalledTimes(1);
});
