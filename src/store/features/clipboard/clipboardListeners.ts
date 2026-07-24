import { isAnyOf, type ListenerMiddlewareInstance } from "@reduxjs/toolkit";
import editorActions from "store/features/editor/editorActions";
import type { RootState } from "store/storeTypes";

type StartAppListening =
  ListenerMiddlewareInstance<RootState>["startListening"];

export const registerClipboardListeners = (
  startListening: StartAppListening,
) => {
  startListening({
    matcher: isAnyOf(
      editorActions.selectWorld,
      editorActions.selectScene,
      editorActions.selectActor,
      editorActions.selectTrigger,
      editorActions.selectCustomEvent,
      editorActions.selectVariable,
      editorActions.dragActorStart,
      editorActions.dragTriggerStart,
    ),
    effect: () => {
      // Remove text selection (likely from debugger build log) when making a
      // selection so the application copy/paste bindings remain available.
      window.getSelection()?.removeAllRanges();
    },
  });
};
