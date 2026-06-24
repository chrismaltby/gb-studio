import { BRUSH_16PX, TILE_SIZE } from "consts";
import type { Brush } from "store/features/editor/editorState";

export const paintCursorSize = (brush: Brush) =>
  brush === BRUSH_16PX ? TILE_SIZE * 2 : TILE_SIZE;

export interface AxisLockState {
  lockX?: boolean;
  lockY?: boolean;
}

export interface AxisLockedLine extends AxisLockState {
  endX: number;
  endY: number;
}

export const resolveAxisLockedLine = (
  state: AxisLockState,
  startX: number,
  startY: number,
  x: number,
  y: number,
): AxisLockedLine => {
  const { lockX, lockY } = state;

  if (lockX) {
    return { lockX, lockY, endX: startX, endY: y };
  }

  if (lockY) {
    return { lockX, lockY, endX: x, endY: startY };
  }

  if (x !== startX) {
    return { lockX, lockY: true, endX: x, endY: startY };
  }

  if (y !== startY) {
    return { lockX: true, lockY, endX: startX, endY: y };
  }

  return { lockX, lockY, endX: x, endY: y };
};
