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
import { useAppDispatch, useAppSelector, useAppStore } from "store/hooks";
import type { SceneCursorViewModel } from "../SceneCursorView";
import type {
  SceneCursorMode,
  SceneCursorMouseDownHandler,
  SceneCursorMouseMoveHandler,
  SceneCursorMouseUpHandler,
} from "./SceneCursorMode";
import {
  paintCursorSize,
  resetPaintInteractionForScene,
  resolveAxisLockedLine,
  shouldPaintCollisionBrush,
} from "./paintCursorHelpers";

interface CollisionPaintState {
  sceneId?: string;
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

export const useCollisionPaintCursorMode = (
  getCursorRect: () => DOMRect | undefined,
): SceneCursorMode => {
  const dispatch = useAppDispatch();
  const store = useAppStore();

  const {
    tool,
    selectedBrush,
    selectedTileType,
    selectedTileMask,
    scenePaintEraser,
  } = useAppSelector((state) => state.editor);

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
    (sceneId: string, x: number, y: number): number => {
      const scene = sceneSelectors.selectById(store.getState(), sceneId);

      if (!scene || !Array.isArray(scene.collisions)) {
        return 0;
      }

      return scene.collisions[x + y * scene.width] ?? 0;
    },
    [store],
  );

  const paintCollisionAt = useCallback(
    (sceneId: string, x: number, y: number, value: number, mask: number) => {
      const rootState = store.getState();
      const scene = sceneSelectors.selectById(rootState, sceneId);
      const tileLookup =
        selectedBrush === BRUSH_MAGIC
          ? rootState.assets.backgrounds[scene?.backgroundId ?? ""]?.lookup
          : undefined;

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
    [dispatch, selectedBrush, store],
  );

  const paintCollisionLine = useCallback(
    (
      sceneId: string,
      startX: number,
      startY: number,
      endX: number,
      endY: number,
      value: number,
      mask: number,
    ) => {
      const rootState = store.getState();
      const scene = sceneSelectors.selectById(rootState, sceneId);
      const tileLookup =
        selectedBrush === BRUSH_MAGIC
          ? rootState.assets.backgrounds[scene?.backgroundId ?? ""]?.lookup
          : undefined;

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
    [dispatch, selectedBrush, store],
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
        tool !== TOOL_COLLISIONS ||
        selectedBrush !== BRUSH_SLOPE ||
        !state.isPainting ||
        !state.sceneId ||
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
          sceneId: state.sceneId,
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
    [dispatch, selectedBrush, tool],
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
      const sceneId = e.sceneId;
      const rootState = store.getState();
      const scene = sceneSelectors.selectById(rootState, sceneId);
      const state = stateRef.current;

      resetPaintInteractionForScene(state, sceneId);
      state.drawLine = e.raw.shiftKey;
      state.drawWall = e.raw.ctrlKey;
      state.lockX = undefined;
      state.lockY = undefined;
      state.currentX = undefined;
      state.currentY = undefined;

      if (e.raw.altKey) {
        const hoverCollision = getCollisionAt(sceneId, x, y);

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
        const mask = scenePaintEraser ? 0xff : (selectedTileMask ?? 0xff);

        state.mask = mask;
        state.drawTile =
          !scenePaintEraser &&
          shouldPaintCollisionBrush(
            scene.collisions,
            scene.width,
            scene.height,
            x,
            y,
            brushSize,
            selectedTileType,
            mask,
          )
            ? selectedTileType
            : 0;
      }

      if (selectedBrush === BRUSH_FILL) {
        paintCollisionAt(sceneId, x, y, state.drawTile, state.mask);
      } else if (selectedBrush === BRUSH_MAGIC) {
        const tileLookup =
          rootState.assets.backgrounds[scene.backgroundId]?.lookup;

        if (tileLookup) {
          paintCollisionAt(sceneId, x, y, state.drawTile, state.mask);
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
          paintCollisionLine(
            sceneId,
            startX,
            startY,
            x,
            y,
            state.drawTile,
            state.mask,
          );

          state.startX = x;
          state.startY = y;
        } else {
          state.startX = x;
          state.startY = y;

          paintCollisionAt(sceneId, x, y, state.drawTile, state.mask);
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
      scenePaintEraser,
      selectedBrush,
      selectedTileMask,
      selectedTileType,
      store,
      tool,
    ],
  );

  const onMouseMove = useCallback<SceneCursorMouseMoveHandler>(
    (e) => {
      const state = stateRef.current;

      if (!e.isOverScene || !state.isPainting) {
        return;
      }

      const { x, y } = e;

      if (selectedBrush === BRUSH_SLOPE) {
        state.currentX = x;
        state.currentY = y;

        updateSlopeDirection(e.raw);
        updateSlopePreview(x, y, e.raw.shiftKey, e.raw.ctrlKey);
        return;
      }

      state.drawLine = e.raw.shiftKey;
      state.drawWall = e.raw.ctrlKey;

      if (state.currentX === x && state.currentY === y) {
        return;
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
          e.sceneId,
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
        paintCollisionLine(
          e.sceneId,
          startX,
          startY,
          x,
          y,
          state.drawTile,
          state.mask,
        );

        state.startX = x;
        state.startY = y;
      }

      state.currentX = x;
      state.currentY = y;
    },
    [
      paintCollisionLine,
      selectedBrush,
      updateSlopeDirection,
      updateSlopePreview,
    ],
  );

  const resetPaintState = useCallback(() => {
    const state = stateRef.current;

    state.isPainting = false;
    state.isDrawingSlope = false;
    state.lockX = undefined;
    state.lockY = undefined;

    if (state.sceneId) {
      dispatch(
        editorActions.setSlopePreview({
          sceneId: state.sceneId,
          slopePreview: undefined,
        }),
      );
    }
  }, [dispatch]);

  const onMouseUp = useCallback<SceneCursorMouseUpHandler>(
    (e) => {
      const state = stateRef.current;

      if (!state.isPainting && !state.isDrawingSlope) {
        return;
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
            sceneId: state.sceneId ?? e.sceneId,
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

      resetPaintState();
    },
    [dispatch, resetPaintState],
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

  const onCancel = resetPaintState;

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
      onCancel,
    }),
    [onCancel, onMouseDown, onMouseMove, onMouseUp, tool, view],
  );
};
