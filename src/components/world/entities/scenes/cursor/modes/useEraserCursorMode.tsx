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

interface EraserState {
  lockX?: boolean;
  lockY?: boolean;
  startX: number;
  startY: number;
  currentX?: number;
  currentY?: number;
  drawLine: boolean;
  isPainting: boolean;
}

export const useEraserCursorMode = ({
  enabled,
  sceneId,
}: SceneCursorModeContext): SceneCursorMode => {
  const dispatch = useAppDispatch();

  const { tool, selectedBrush, showLayers } = useAppSelector(
    (state) => state.editor,
  );

  const showCollisions = useAppSelector(
    (state) => state.project.present.settings.showCollisions,
  );

  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, sceneId),
  );

  const backgroundId = scene?.backgroundId ?? "";

  const tileLookup = useAppSelector((state) =>
    selectedBrush === BRUSH_MAGIC
      ? state.assets.backgrounds[backgroundId]?.lookup
      : undefined,
  );

  const stateRef = useRef<EraserState>({
    startX: 0,
    startY: 0,
    drawLine: false,
    isPainting: false,
  });

  const eraseCollisionAt = useCallback(
    (x: number, y: number) => {
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
    [dispatch, sceneId, selectedBrush, tileLookup],
  );

  const eraseCollisionLine = useCallback(
    (startX: number, startY: number, endX: number, endY: number) => {
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
    [dispatch, sceneId, selectedBrush, tileLookup],
  );

  const eraseActorsAndTriggersAt = useCallback(
    (x: number, y: number) => {
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
    [dispatch, sceneId, selectedBrush],
  );

  const onMouseDown = useCallback<SceneCursorMouseDownHandler>(
    (e) => {
      if (!enabled || !e.isOverScene) {
        return false;
      }

      const isEraserTool = tool === TOOL_ERASER;
      const isCollisionRightClick =
        tool === TOOL_COLLISIONS && e.raw.nativeEvent.which === 3;

      if (!isEraserTool && !isCollisionRightClick) {
        return false;
      }

      const { x, y } = e;
      const state = stateRef.current;

      state.drawLine = e.raw.shiftKey;
      state.lockX = undefined;
      state.lockY = undefined;
      state.currentX = undefined;
      state.currentY = undefined;

      if (showCollisions) {
        if (selectedBrush === BRUSH_FILL) {
          eraseCollisionAt(x, y);
        } else if (selectedBrush === BRUSH_MAGIC) {
          if (tileLookup) {
            eraseCollisionAt(x, y);
          } else {
            dispatch(editorActions.selectScene({ sceneId }));
          }
        } else {
          if (state.drawLine) {
            eraseCollisionLine(state.startX, state.startY, x, y);
            state.startX = x;
            state.startY = y;
          } else {
            state.startX = x;
            state.startY = y;
            eraseCollisionAt(x, y);
          }

          state.isPainting = true;
        }
      }

      if (showLayers) {
        eraseActorsAndTriggersAt(x, y);
      }

      return true;
    },
    [
      dispatch,
      enabled,
      eraseActorsAndTriggersAt,
      eraseCollisionAt,
      eraseCollisionLine,
      sceneId,
      selectedBrush,
      showCollisions,
      showLayers,
      tileLookup,
      tool,
    ],
  );

  const onMouseMove = useCallback<SceneCursorMouseMoveHandler>(
    (e) => {
      const state = stateRef.current;

      if (!state.isPainting) {
        return false;
      }

      if (
        !enabled ||
        !e.isOverScene ||
        !showCollisions ||
        (tool !== TOOL_ERASER && tool !== TOOL_COLLISIONS)
      ) {
        return true;
      }

      const { x, y } = e;

      if (state.currentX === x && state.currentY === y) {
        return true;
      }

      if (state.drawLine) {
        const line = resolveAxisLockedLine(
          state,
          state.startX,
          state.startY,
          x,
          y,
        );

        eraseCollisionLine(state.startX, state.startY, line.endX, line.endY);

        state.lockX = line.lockX;
        state.lockY = line.lockY;
        state.startX = line.endX;
        state.startY = line.endY;
      } else {
        eraseCollisionLine(state.startX, state.startY, x, y);

        state.startX = x;
        state.startY = y;
      }

      state.currentX = x;
      state.currentY = y;

      return true;
    },
    [enabled, eraseCollisionLine, showCollisions, tool],
  );

  const onMouseUp = useCallback<SceneCursorMouseUpHandler>(() => {
    const state = stateRef.current;

    if (!state.isPainting) {
      return false;
    }

    state.isPainting = false;
    state.lockX = undefined;
    state.lockY = undefined;

    return true;
  }, []);

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
    }),
    [onMouseDown, onMouseMove, onMouseUp, tool, view],
  );
};
