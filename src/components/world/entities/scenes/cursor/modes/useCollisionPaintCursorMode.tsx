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
import { paintCursorSize } from "./helpers";

interface CollisionPaintState {
  lockX?: boolean;
  lockY?: boolean;
  startX: number;
  startY: number;
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
  hoverSceneId,
  x,
  y,
  getCursorRect,
}: SceneCursorModeContext): SceneCursorMode => {
  const dispatch = useAppDispatch();

  const { tool, selectedBrush, selectedTileType, selectedTileMask } =
    useAppSelector((state) => state.editor);

  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, hoverSceneId),
  );

  const backgroundId = scene?.backgroundId ?? "";

  const tileLookup = useAppSelector((state) =>
    selectedBrush === BRUSH_MAGIC
      ? state.assets.backgrounds[backgroundId]?.lookup
      : undefined,
  );

  const stateRef = useRef<CollisionPaintState>({
    startX: 0,
    startY: 0,
    drawLine: false,
    drawWall: false,
    drawTile: 0,
    mask: 0xff,
    isPainting: false,
    isDrawingSlope: false,
    slopeDirectionHorizontal: "left",
    slopeDirectionVertical: "left",
  });

  const hoverCollision =
    scene && Array.isArray(scene.collisions)
      ? (scene.collisions[x + y * scene.width] ?? 0)
      : 0;

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
    (drawLine: boolean, drawWall: boolean) => {
      const state = stateRef.current;

      if (
        !enabled ||
        sceneId !== hoverSceneId ||
        tool !== TOOL_COLLISIONS ||
        selectedBrush !== BRUSH_SLOPE ||
        !state.isPainting
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
    [dispatch, enabled, hoverSceneId, sceneId, selectedBrush, tool, x, y],
  );

  const onMouseDown = useCallback<SceneCursorMouseDownHandler>(
    (e) => {
      if (tool !== TOOL_COLLISIONS) {
        return false;
      }

      if (e.nativeEvent.which === 3) {
        return false;
      }

      const state = stateRef.current;

      state.drawLine = e.shiftKey;
      state.drawWall = e.ctrlKey;
      state.lockX = undefined;
      state.lockY = undefined;
      state.currentX = undefined;
      state.currentY = undefined;

      if (e.altKey) {
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

      if (!state.drawLine) {
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
        dispatch(
          entitiesActions.paintCollision({
            brush: selectedBrush,
            sceneId,
            x,
            y,
            value: state.drawTile,
            mask: state.mask,
            tileLookup,
          }),
        );
      } else if (selectedBrush === BRUSH_MAGIC) {
        if (tileLookup) {
          dispatch(
            entitiesActions.paintCollision({
              brush: selectedBrush,
              sceneId,
              tileLookup,
              x,
              y,
              value: state.drawTile,
              mask: state.mask,
            }),
          );
        } else {
          dispatch(editorActions.selectScene({ sceneId }));
        }
      } else if (selectedBrush === BRUSH_SLOPE) {
        state.startX = x;
        state.startY = y;
        state.isPainting = true;
        state.isDrawingSlope = false;

        dispatch(
          editorActions.setSlopePreview({
            sceneId,
            slopePreview: undefined,
          }),
        );
      } else {
        if (state.drawLine) {
          dispatch(
            entitiesActions.paintCollision({
              brush: selectedBrush,
              sceneId,
              x: state.startX,
              y: state.startY,
              endX: x,
              endY: y,
              value: state.drawTile,
              mask: state.mask,
              drawLine: true,
              tileLookup,
            }),
          );

          state.startX = x;
          state.startY = y;
        } else {
          state.startX = x;
          state.startY = y;

          dispatch(
            entitiesActions.paintCollision({
              brush: selectedBrush,
              sceneId,
              x,
              y,
              value: state.drawTile,
              mask: state.mask,
              tileLookup,
            }),
          );
        }

        state.isPainting = true;
      }

      return true;
    },
    [
      dispatch,
      hoverCollision,
      scene,
      sceneId,
      selectedBrush,
      selectedTileMask,
      selectedTileType,
      tileLookup,
      tool,
      x,
      y,
    ],
  );

  const onMouseMove = useCallback<SceneCursorMouseMoveHandler>(
    (e) => {
      const state = stateRef.current;

      if (
        !enabled ||
        sceneId !== hoverSceneId ||
        tool !== TOOL_COLLISIONS ||
        !state.isPainting
      ) {
        return false;
      }

      if (selectedBrush === BRUSH_SLOPE) {
        updateSlopeDirection(e);
        updateSlopePreview(e.shiftKey, e.ctrlKey);
        return true;
      }

      state.drawLine = e.shiftKey;
      state.drawWall = e.ctrlKey;

      if (state.currentX === x && state.currentY === y) {
        return true;
      }

      if (state.drawLine) {
        let x1 = x;
        let y1 = y;

        if (state.lockX) {
          x1 = state.startX;
        } else if (state.lockY) {
          y1 = state.startY;
        } else if (x !== state.startX) {
          state.lockY = true;
          y1 = state.startY;
        } else if (y !== state.startY) {
          state.lockX = true;
          x1 = state.startX;
        }

        dispatch(
          entitiesActions.paintCollision({
            brush: selectedBrush,
            sceneId,
            x: state.startX,
            y: state.startY,
            endX: x1,
            endY: y1,
            value: state.drawTile,
            mask: state.mask,
            drawLine: true,
            tileLookup,
          }),
        );

        state.startX = x1;
        state.startY = y1;
      } else {
        dispatch(
          entitiesActions.paintCollision({
            brush: selectedBrush,
            sceneId,
            x: state.startX,
            y: state.startY,
            endX: x,
            endY: y,
            value: state.drawTile,
            mask: state.mask,
            drawLine: true,
            tileLookup,
          }),
        );

        state.startX = x;
        state.startY = y;
      }

      state.currentX = x;
      state.currentY = y;

      return true;
    },
    [
      dispatch,
      enabled,
      hoverSceneId,
      sceneId,
      selectedBrush,
      tileLookup,
      tool,
      updateSlopeDirection,
      updateSlopePreview,
      x,
      y,
    ],
  );

  const onMouseUp = useCallback<SceneCursorMouseUpHandler>(
    (e) => {
      const state = stateRef.current;

      if (!state.isPainting && !state.isDrawingSlope) {
        return false;
      }

      state.drawLine = e.shiftKey;
      state.drawWall = e.ctrlKey;

      if (state.isDrawingSlope) {
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
    [dispatch, sceneId, tool, x, y],
  );

  useEffect(() => {
    if (tool !== TOOL_COLLISIONS || selectedBrush !== BRUSH_SLOPE) {
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      if (e.target.nodeName !== "BODY") return;

      updateSlopePreview(e.shiftKey, e.ctrlKey);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      if (e.target.nodeName !== "BODY") return;

      updateSlopePreview(e.shiftKey, e.ctrlKey);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
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
