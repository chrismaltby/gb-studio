import { TILE_SIZE } from "consts";
import type { Brush, Tool } from "store/features/editor/editorState";
import type { SceneCursorViewModel } from "../SceneCursorView";

export interface SceneCursorModeContext {
  tool: Tool;
  brush: Brush;
  isResizingTrigger: boolean;
}

export interface SceneCursorMode {
  id: string;
  enabled: boolean;
  viewPriority: number;
  view?: SceneCursorViewModel;
}

export const DEFAULT_SCENE_CURSOR_VIEW: SceneCursorViewModel = {
  variant: "default",
  width: TILE_SIZE,
  height: TILE_SIZE,
};

export const getSceneCursorView = (
  modes: readonly SceneCursorMode[],
): SceneCursorViewModel => {
  return (
    [...modes]
      .filter((mode) => mode.enabled && mode.view)
      .sort((a, b) => b.viewPriority - a.viewPriority)[0]?.view ??
    DEFAULT_SCENE_CURSOR_VIEW
  );
};
