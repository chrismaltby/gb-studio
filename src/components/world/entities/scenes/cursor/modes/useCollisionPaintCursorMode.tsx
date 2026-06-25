import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  BRUSH_16PX,
  BRUSH_FILL,
  BRUSH_MAGIC,
  BRUSH_SLOPE,
  TOOL_COLLISIONS,
} from "consts";
import { BrickIcon } from "ui/icons/Icons";
import { sceneSelectors } from "store/features/entities/entitiesSelectors";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { calculateSlope } from "shared/lib/helpers/slope";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { SceneCursorViewModel } from "../SceneCursorView";
import type {
  SceneCursorMode,
  SceneCursorModeContext,
  SceneCursorMouseDownHandler,
  SceneCursorMouseMoveHandler,
  SceneCursorMouseUpHandler,
} from "./SceneCursorMode";
import { paintCursorSize, resolveAxisLockedLine } from "./paintCursorHelpers";

interface CollisionPaintState {
  lockX?: boolean;
  lockY?: boolean;
  startX?: number;
  startY?: number;
  currentX?: number;
  currentY?: number;
  drawLine: boolean;
  drawWall: boolean;
  drawTile: number;
  mask: number;
  isPainting: boolean;
  isDrawingSlope: boolean;
  slopeDirectionHorizontal: "left" | "right";
  slopeDirectionVertical: "left" | "right";
}

export const useCollisionPaintCursorMode = ({
  enabled,
  sceneId,
  getCursorRect,
}: SceneCursorModeContext): SceneCursorMode => {
  const dispatch = useAppDispatch();

  const { tool, selectedBrush, selectedTileType, selectedTileMask } =
    useAppSelector((state) => state.editor);

  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, sceneId),
  );

  const backgroundId = scene?.backgroundId ?? "";

  const tileLookup = useAppSelector((state) =>
    selectedBrush === BRUSH_MAGIC
      ? state.assets.backgrounds[backgroundId]?.lookup
      : undefined,
  );

  const stateRef = useRef<CollisionPaintState>({
    drawLine: false,
    drawWall: false,
    drawTile: 0,
    mask: 0xff,
    isPainting: false,
    isDrawingSlope: false,
    slopeDirectionHorizontal: "left",
    slopeDirectionVertical: "left",
  });

  const getCollisionAt = useCallback(
    (x: number, y: number): number => {
      if (!scene || !Array.isArray(scene.collisions)) {
        return 0;
      }

      return scene.collisions[x + y * scene.width] ?? 0;
    },
    [scene],
  );

  const paintCollisionAt = useCallback(
    (x: number, y: number, value: number, mask: number) => {
      dispatch(
        entitiesActions.paintCollision({
          brush: selectedBrush,
          sceneId,
          x,
          y,
          value,
          mask,
          tileLookup,
        }),
      );
    },
    [dispatch, sceneId, selectedBrush, tileLookup],
  );

  const paintCollisionLine = useCallback(
    (
      startX: number,
      startY: number,
      endX: number,
      endY: number,
      value: number,
      mask: number,
    ) => {
      dispatch(
        entitiesActions.paintCollision({
          brush: selectedBrush,
          sceneId,
          x: startX,
          y: startY,
          endX,
          endY,
          value,
          mask,
          drawLine: true,
          tileLookup,
        }),
      );
    },
    [dispatch, sceneId, selectedBrush, tileLookup],
  );

  const updateSlopeDirection = useCallback(
    (e: MouseEvent) => {
      const rect = getCursorRect();

      if (!rect) {
        return;
      }

      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;

      const state = stateRef.current;

      state.slopeDirectionHorizontal =
        localY > rect.height * 0.5 ? "left" : "right";
      state.slopeDirectionVertical =
        localX <= rect.width * 0.5 ? "left" : "right";
    },
    [getCursorRect],
  );

  const updateSlopePreview = useCallback(
    (x: number, y: number, drawLine: boolean, drawWall: boolean) => {
      const state = stateRef.current;

      if (
        !enabled ||
        tool !== TOOL_COLLISIONS ||
        selectedBrush !== BRUSH_SLOPE ||
        !state.isPainting ||
        state.startX === undefined ||
        state.startY === undefined
      ) {
        return;
      }

      state.drawLine = drawLine;
      state.drawWall = drawWall;
      state.isDrawingSlope = true;

      const { endX, endY, slopeIncline } = calculateSlope(
        state.startX,
        state.startY,
        x,
        y,
        state.slopeDirectionHorizontal,
        state.slopeDirectionVertical,
        state.drawWall,
      );

      dispatch(
        editorActions.setSlopePreview({
          sceneId,
          slopePreview: {
            startX: state.startX,
            startY: state.startY,
            endX,
            endY,
            offset: state.drawLine,
            slopeIncline,
          },
        }),
      );
    },
    [dispatch, enabled, sceneId, selectedBrush, tool],
  );

  const onMouseDown = useCallback<SceneCursorMouseDownHandler>(
    (e) => {
      if (tool !== TOOL_COLLISIONS) {
        return false;
      }

      if (e.raw.nativeEvent.which === 3) {
        return false;
      }

      const { x, y } = e;
      const state = stateRef.current;

      state.drawLine = e.raw.shiftKey;
      state.drawWall = e.raw.ctrlKey;
      state.lockX = undefined;
      state.lockY = undefined;
      state.currentX = undefined;
      state.currentY = undefined;

      if (e.raw.altKey) {
        const hoverCollision = getCollisionAt(x, y);

        state.drawTile = hoverCollision;
        dispatch(
          editorActions.setSelectedTileType({
            tileType: hoverCollision,
            tileMask: 0xff,
          }),
        );
        return true;
      }

      if (!scene) {
        return false;
      }

      if (selectedBrush !== BRUSH_SLOPE) {
        const brushSize = selectedBrush === BRUSH_16PX ? 2 : 1;
        const mask = selectedTileMask ?? 0xff;

        state.drawTile = 0;
        state.mask = mask;

        // If any tile under brush is currently not filled then
        // paint collisions rather than remove them.
        for (let xi = x; xi < x + brushSize; xi++) {
          for (let yi = y; yi < y + brushSize; yi++) {
            const collisionIndex = scene.width * yi + xi;
            const currentTileOverlap =
              (scene.collisions[collisionIndex] ?? 0) & mask;

            if (currentTileOverlap === (selectedTileType & mask)) {
              state.drawTile = 0;
            } else {
              state.drawTile = selectedTileType;
            }
          }
        }
      }

      if (selectedBrush === BRUSH_FILL) {
        paintCollisionAt(x, y, state.drawTile, state.mask);
      } else if (selectedBrush === BRUSH_MAGIC) {
        if (tileLookup) {
          paintCollisionAt(x, y, state.drawTile, state.mask);
        } else {
          dispatch(editorActions.selectScene({ sceneId }));
        }
      } else if (selectedBrush === BRUSH_SLOPE) {
        state.startX = x;
        state.startY = y;
        state.currentX = x;
        state.currentY = y;
        state.isPainting = true;
        state.isDrawingSlope = false;

        dispatch(
          editorActions.setSlopePreview({
            sceneId,
            slopePreview: undefined,
          }),
        );
      } else {
        const startX = state.startX;
        const startY = state.startY;

        if (state.drawLine && startX !== undefined && startY !== undefined) {
          paintCollisionLine(startX, startY, x, y, state.drawTile, state.mask);

          state.startX = x;
          state.startY = y;
        } else {
          state.startX = x;
          state.startY = y;

          paintCollisionAt(x, y, state.drawTile, state.mask);
        }

        state.isPainting = true;
      }

      return true;
    },
    [
      dispatch,
      getCollisionAt,
      paintCollisionAt,
      paintCollisionLine,
      scene,
      sceneId,
      selectedBrush,
      selectedTileMask,
      selectedTileType,
      tileLookup,
      tool,
    ],
  );

  const onMouseMove = useCallback<SceneCursorMouseMoveHandler>(
    (e) => {
      const state = stateRef.current;

      if (
        !enabled ||
        !e.isOverScene ||
        tool !== TOOL_COLLISIONS ||
        !state.isPainting
      ) {
        return false;
      }

      const { x, y } = e;

      if (selectedBrush === BRUSH_SLOPE) {
        state.currentX = x;
        state.currentY = y;

        updateSlopeDirection(e.raw);
        updateSlopePreview(x, y, e.raw.shiftKey, e.raw.ctrlKey);
        return true;
      }

      state.drawLine = e.raw.shiftKey;
      state.drawWall = e.raw.ctrlKey;

      if (state.currentX === x && state.currentY === y) {
        return true;
      }

      let startX = state.startX;
      let startY = state.startY;

      if (startX === undefined || startY === undefined) {
        startX = x;
        startY = y;
        state.startX = x;
        state.startY = y;
      }

      if (state.drawLine) {
        const line = resolveAxisLockedLine(state, startX, startY, x, y);

        paintCollisionLine(
          startX,
          startY,
          line.endX,
          line.endY,
          state.drawTile,
          state.mask,
        );

        state.lockX = line.lockX;
        state.lockY = line.lockY;
        state.startX = line.endX;
        state.startY = line.endY;
      } else {
        paintCollisionLine(startX, startY, x, y, state.drawTile, state.mask);

        state.startX = x;
        state.startY = y;
      }

      state.currentX = x;
      state.currentY = y;

      return true;
    },
    [
      enabled,
      paintCollisionLine,
      selectedBrush,
      tool,
      updateSlopeDirection,
      updateSlopePreview,
    ],
  );

  const onMouseUp = useCallback<SceneCursorMouseUpHandler>(
    (e) => {
      const state = stateRef.current;

      if (!state.isPainting && !state.isDrawingSlope) {
        return false;
      }

      const x = e.isOverScene ? e.x : (state.currentX ?? state.startX);
      const y = e.isOverScene ? e.y : (state.currentY ?? state.startY);

      state.drawLine = e.raw.shiftKey;
      state.drawWall = e.raw.ctrlKey;

      if (
        state.isDrawingSlope &&
        state.startX !== undefined &&
        state.startY !== undefined &&
        x !== undefined &&
        y !== undefined
      ) {
        const { endX, endY, slopeIncline } = calculateSlope(
          state.startX,
          state.startY,
          x,
          y,
          state.slopeDirectionHorizontal,
          state.slopeDirectionVertical,
          state.drawWall,
        );

        dispatch(
          entitiesActions.paintSlopeCollision({
            sceneId,
            startX: state.startX,
            startY: state.startY,
            endX,
            endY,
            offset: state.drawLine,
            slopeIncline,
            slopeDirection:
              Math.sign(endX - state.startX) === Math.sign(state.startY - endY)
                ? "right"
                : "left",
          }),
        );
      }

      state.isPainting = false;
      state.isDrawingSlope = false;
      state.lockX = undefined;
      state.lockY = undefined;

      return true;
    },
    [dispatch, sceneId],
  );

  useEffect(() => {
    if (tool !== TOOL_COLLISIONS || selectedBrush !== BRUSH_SLOPE) {
      return;
    }

    const updateFromKeyboard = (e: KeyboardEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      if (e.target.nodeName !== "BODY") return;

      const state = stateRef.current;
      const x = state.currentX ?? state.startX;
      const y = state.currentY ?? state.startY;

      if (x === undefined || y === undefined) {
        return;
      }

      updateSlopePreview(x, y, e.shiftKey, e.ctrlKey);
    };

    window.addEventListener("keydown", updateFromKeyboard);
    window.addEventListener("keyup", updateFromKeyboard);

    return () => {
      window.removeEventListener("keydown", updateFromKeyboard);
      window.removeEventListener("keyup", updateFromKeyboard);
    };
  }, [selectedBrush, tool, updateSlopePreview]);

  const view = useMemo<SceneCursorViewModel>(() => {
    const size = paintCursorSize(selectedBrush);

    return {
      variant: "collisions",
      width: size,
      height: size,
      bubble: <BrickIcon />,
    };
  }, [selectedBrush]);

  return useMemo(
    () => ({
      id: "collisionPaint",
      enabled: tool === TOOL_COLLISIONS,
      viewPriority: 10,
      eventPriority: 10,
      view,
      onMouseDown,
      onMouseMove,
      onMouseUp,
    }),
    [onMouseDown, onMouseMove, onMouseUp, tool, view],
  );
};
