import type React from "react";
import { TILE_SIZE } from "consts";
import type { SceneCursorViewModel } from "../SceneCursorView";

export interface SceneCursorModeContext {
  enabled: boolean;
  sceneId: string;
  getCursorRect: () => DOMRect | undefined;
}

export type SceneCursorEvent<T> = {
  x: number;
  y: number;
  sceneId: string;
  isOverScene: boolean;
  raw: T;
};

export type SceneCursorMouseDownHandler = (
  e: SceneCursorEvent<React.MouseEvent<HTMLDivElement, MouseEvent>>,
) => boolean;

export type SceneCursorMouseMoveHandler = (
  e: SceneCursorEvent<MouseEvent>,
) => boolean;

export type SceneCursorMouseUpHandler = (
  e: SceneCursorEvent<MouseEvent>,
) => boolean;

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
