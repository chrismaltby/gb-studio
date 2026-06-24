import type React from "react";
import { TILE_SIZE } from "consts";
import type { Brush, Tool } from "store/features/editor/editorState";
import type { SceneCursorViewModel } from "../SceneCursorView";

export interface SceneCursorModeContext {
  sceneId: string;
  hoverSceneId: string;
  x: number;
  y: number;
  tool: Tool;
  brush: Brush;
  pasteMode: boolean;
  editorPrefabId?: string;
}

export type SceneCursorMouseDownHandler = (
  e: React.MouseEvent<HTMLDivElement, MouseEvent>,
) => boolean;

export type SceneCursorMouseMoveHandler = () => boolean;

export type SceneCursorMouseUpHandler = () => boolean;

export interface SceneCursorMode {
  id: string;
  enabled: boolean;
  viewPriority: number;
  eventPriority: number;
  view?: SceneCursorViewModel;
  onMouseDown?: SceneCursorMouseDownHandler;
  onMouseMove?: SceneCursorMouseMoveHandler;
  onMouseUp?: SceneCursorMouseUpHandler;
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

export const getSceneCursorEventModes = (
  modes: readonly SceneCursorMode[],
): SceneCursorMode[] => {
  return [...modes]
    .filter(
      (mode) =>
        mode.enabled &&
        (mode.onMouseDown || mode.onMouseMove || mode.onMouseUp),
    )
    .sort((a, b) => b.eventPriority - a.eventPriority);
};
