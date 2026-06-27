import { BRUSH_16PX, TILE_SIZE } from "consts";
import type { Brush } from "store/features/editor/editorState";

export const paintCursorSize = (brush: Brush) =>
  brush === BRUSH_16PX ? TILE_SIZE * 2 : TILE_SIZE;

export interface AxisLockState {
  lockX?: boolean;
  lockY?: boolean;
}

export interface PaintInteractionSceneState extends AxisLockState {
  sceneId?: string;
  startX?: number;
  startY?: number;
  currentX?: number;
  currentY?: number;
}

export const resetPaintInteractionForScene = (
  state: PaintInteractionSceneState,
  sceneId: string,
) => {
  if (state.sceneId === sceneId) {
    return;
  }

  state.sceneId = sceneId;
  state.startX = undefined;
  state.startY = undefined;
  state.currentX = undefined;
  state.currentY = undefined;
  state.lockX = undefined;
  state.lockY = undefined;
};

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

export const shouldPaintCollisionBrush = (
  collisions: readonly number[],
  sceneWidth: number,
  sceneHeight: number,
  x: number,
  y: number,
  brushSize: number,
  tile: number,
  mask: number,
): boolean => {
  const expectedTile = tile & mask;
  const endX = Math.min(x + brushSize, sceneWidth);
  const endY = Math.min(y + brushSize, sceneHeight);

  for (let xi = x; xi < endX; xi++) {
    for (let yi = y; yi < endY; yi++) {
      const currentTile = collisions[sceneWidth * yi + xi] ?? 0;

      if ((currentTile & mask) !== expectedTile) {
        return true;
      }
    }
  }

  return false;
};
