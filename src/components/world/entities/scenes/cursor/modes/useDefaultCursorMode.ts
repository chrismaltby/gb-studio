import { useMemo } from "react";
import type { SceneCursorMode } from "./SceneCursorMode";
import { DEFAULT_SCENE_CURSOR_VIEW } from "./SceneCursorMode";

export const useDefaultCursorMode = (): SceneCursorMode => {
  return useMemo(
    () => ({
      id: "default",
      enabled: true,
      viewPriority: -100,
      eventPriority: -100,
      view: DEFAULT_SCENE_CURSOR_VIEW,
      onMouseDown: () => false,
    }),
    [],
  );
};
