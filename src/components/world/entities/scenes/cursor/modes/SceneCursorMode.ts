import type React from "react";
import { TILE_SIZE } from "consts";
import type { SceneCursorViewModel } from "../SceneCursorView";

export type SceneCursorEvent<T> = {
  x: number;
  y: number;
  pX: number;
  pY: number;
  sceneId: string;
  isOverScene: boolean;
  raw: T;
};

export type SceneCursorMouseDownRawEvent =
  | React.MouseEvent<HTMLDivElement, MouseEvent>
  | (Pick<MouseEvent, "altKey" | "ctrlKey" | "metaKey" | "shiftKey"> & {
      nativeEvent: MouseEvent;
    });

export type SceneCursorMouseDownHandler = (
  e: SceneCursorEvent<SceneCursorMouseDownRawEvent>,
) => boolean;

export type SceneCursorMouseMoveHandler = (
  e: SceneCursorEvent<MouseEvent>,
) => void;

export type SceneCursorMouseUpHandler = (
  e: SceneCursorEvent<MouseEvent>,
) => void;

export type SceneCursorCancelHandler = () => void;

export interface SceneCursorMode {
  id: string;
  enabled: boolean;
  viewPriority: number;
  eventPriority: number;
  captureEventsWhenEnabled?: boolean;
  view?: SceneCursorViewModel;
  onMouseDown?: SceneCursorMouseDownHandler;
  onMouseMove?: SceneCursorMouseMoveHandler;
  onMouseUp?: SceneCursorMouseUpHandler;
  onCancel?: SceneCursorCancelHandler;
}

export const DEFAULT_SCENE_CURSOR_VIEW: SceneCursorViewModel = {
  variant: "default",
  width: TILE_SIZE,
  height: TILE_SIZE,
};

export const getSceneCursorView = (
  modes: readonly SceneCursorMode[],
): SceneCursorViewModel => {
  let bestMode: SceneCursorMode | undefined;

  for (const mode of modes) {
    if (!mode.enabled || !mode.view) {
      continue;
    }

    if (!bestMode || mode.viewPriority > bestMode.viewPriority) {
      bestMode = mode;
    }
  }

  return bestMode?.view ?? DEFAULT_SCENE_CURSOR_VIEW;
};

export const getSceneCursorEventModes = (
  modes: readonly SceneCursorMode[],
): SceneCursorMode[] => {
  return modes
    .filter((mode) => mode.enabled)
    .sort((a, b) => b.eventPriority - a.eventPriority);
};

export const getCapturedSceneCursorEventMode = (
  modes: readonly SceneCursorMode[],
): SceneCursorMode | undefined => {
  return getSceneCursorEventModes(modes).find(
    (mode) => mode.captureEventsWhenEnabled,
  );
};
