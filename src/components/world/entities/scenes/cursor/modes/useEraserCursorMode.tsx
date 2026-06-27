import React, { useCallback, useMemo, useRef } from "react";
import {
  BRUSH_16PX,
  BRUSH_FILL,
  BRUSH_MAGIC,
  TOOL_COLLISIONS,
  TOOL_ERASER,
} from "consts";
import { CloseIcon } from "ui/icons/Icons";
import { sceneSelectors } from "store/features/entities/entitiesSelectors";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
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
} from "./paintCursorHelpers";

interface EraserState {
  sceneId?: string;
  lockX?: boolean;
  lockY?: boolean;
  startX?: number;
  startY?: number;
  currentX?: number;
  currentY?: number;
  drawLine: boolean;
  isPainting: boolean;
}

export const useEraserCursorMode = (): SceneCursorMode => {
  const dispatch = useAppDispatch();
  const store = useAppStore();

  const { tool, selectedBrush, showLayers } = useAppSelector(
    (state) => state.editor,
  );

  const showCollisions = useAppSelector(
    (state) => state.project.present.settings.showCollisions,
  );

  const stateRef = useRef<EraserState>({
    drawLine: false,
    isPainting: false,
  });

  const eraseCollisionAt = useCallback(
    (sceneId: string, x: number, y: number) => {
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
          value: 0,
          mask: 0xff,
          tileLookup,
        }),
      );
    },
    [dispatch, selectedBrush, store],
  );

  const eraseCollisionLine = useCallback(
    (
      sceneId: string,
      startX: number,
      startY: number,
      endX: number,
      endY: number,
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
          value: 0,
          mask: 0xff,
          drawLine: true,
          tileLookup,
        }),
      );
    },
    [dispatch, selectedBrush, store],
  );

  const eraseActorsAndTriggersAt = useCallback(
    (sceneId: string, x: number, y: number) => {
      dispatch(entitiesActions.removeActorAt({ sceneId, x, y }));
      dispatch(entitiesActions.removeTriggerAt({ sceneId, x, y }));

      if (selectedBrush === BRUSH_16PX) {
        dispatch(entitiesActions.removeActorAt({ sceneId, x: x + 1, y }));
        dispatch(entitiesActions.removeTriggerAt({ sceneId, x: x + 1, y }));
        dispatch(entitiesActions.removeActorAt({ sceneId, x, y: y + 1 }));
        dispatch(entitiesActions.removeTriggerAt({ sceneId, x, y: y + 1 }));
        dispatch(
          entitiesActions.removeActorAt({
            sceneId,
            x: x + 1,
            y: y + 1,
          }),
        );
        dispatch(
          entitiesActions.removeTriggerAt({
            sceneId,
            x: x + 1,
            y: y + 1,
          }),
        );
      }
    },
    [dispatch, selectedBrush],
  );

  const onMouseDown = useCallback<SceneCursorMouseDownHandler>(
    (e) => {
      if (!e.isOverScene) {
        return false;
      }

      const isEraserTool = tool === TOOL_ERASER;
      const isCollisionRightClick =
        tool === TOOL_COLLISIONS && e.raw.nativeEvent.which === 3;

      if (!isEraserTool && !isCollisionRightClick) {
        return false;
      }

      const { x, y } = e;
      const sceneId = e.sceneId;
      const state = stateRef.current;

      resetPaintInteractionForScene(state, sceneId);
      state.drawLine = e.raw.shiftKey;
      state.lockX = undefined;
      state.lockY = undefined;
      state.currentX = undefined;
      state.currentY = undefined;

      if (showCollisions) {
        if (selectedBrush === BRUSH_FILL) {
          eraseCollisionAt(sceneId, x, y);
        } else if (selectedBrush === BRUSH_MAGIC) {
          const rootState = store.getState();
          const scene = sceneSelectors.selectById(rootState, sceneId);
          const tileLookup =
            rootState.assets.backgrounds[scene?.backgroundId ?? ""]?.lookup;

          if (tileLookup) {
            eraseCollisionAt(sceneId, x, y);
          } else {
            dispatch(editorActions.selectScene({ sceneId }));
          }
        } else {
          const startX = state.startX;
          const startY = state.startY;

          if (state.drawLine && startX !== undefined && startY !== undefined) {
            eraseCollisionLine(sceneId, startX, startY, x, y);

            state.startX = x;
            state.startY = y;
          } else {
            state.startX = x;
            state.startY = y;

            eraseCollisionAt(sceneId, x, y);
          }

          state.isPainting = true;
        }
      }

      if (showLayers) {
        eraseActorsAndTriggersAt(sceneId, x, y);
      }

      return true;
    },
    [
      dispatch,
      eraseActorsAndTriggersAt,
      eraseCollisionAt,
      eraseCollisionLine,
      selectedBrush,
      showCollisions,
      showLayers,
      store,
      tool,
    ],
  );

  const onMouseMove = useCallback<SceneCursorMouseMoveHandler>(
    (e) => {
      const state = stateRef.current;

      if (!state.isPainting) {
        return;
      }

      if (!e.isOverScene || !showCollisions) {
        return;
      }

      const { x, y } = e;

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

      state.drawLine = e.raw.shiftKey;

      if (state.drawLine) {
        const line = resolveAxisLockedLine(state, startX, startY, x, y);

        eraseCollisionLine(e.sceneId, startX, startY, line.endX, line.endY);

        state.lockX = line.lockX;
        state.lockY = line.lockY;
        state.startX = line.endX;
        state.startY = line.endY;
      } else {
        eraseCollisionLine(e.sceneId, startX, startY, x, y);

        state.startX = x;
        state.startY = y;
      }

      state.currentX = x;
      state.currentY = y;
    },
    [eraseCollisionLine, showCollisions],
  );

  const resetPaintState = useCallback(() => {
    const state = stateRef.current;

    state.isPainting = false;
    state.lockX = undefined;
    state.lockY = undefined;
  }, []);

  const onMouseUp = useCallback<SceneCursorMouseUpHandler>(() => {
    resetPaintState();
  }, [resetPaintState]);

  const onCancel = resetPaintState;

  const view = useMemo<SceneCursorViewModel>(() => {
    const size = paintCursorSize(selectedBrush);

    return {
      variant: "eraser",
      width: size,
      height: size,
      bubble: <CloseIcon />,
    };
  }, [selectedBrush]);

  return useMemo(
    () => ({
      id: "eraser",
      enabled: tool === TOOL_ERASER || tool === TOOL_COLLISIONS,
      viewPriority: 10,
      eventPriority: 20,
      view: tool === TOOL_ERASER ? view : undefined,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onCancel,
    }),
    [onCancel, onMouseDown, onMouseMove, onMouseUp, tool, view],
  );
};
