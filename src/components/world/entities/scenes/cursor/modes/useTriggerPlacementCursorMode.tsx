import React, { useCallback, useMemo, useRef, useState } from "react";
import { TILE_SIZE, TOOL_SELECT, TOOL_TRIGGERS } from "consts";
import { PlusIcon, ResizeIcon } from "ui/icons/Icons";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import clipboardActions from "store/features/clipboard/clipboardActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { SceneCursorViewModel } from "../SceneCursorView";
import type {
  SceneCursorMode,
  SceneCursorModeContext,
  SceneCursorMouseDownHandler,
  SceneCursorMouseMoveHandler,
  SceneCursorMouseUpHandler,
} from "./SceneCursorMode";

export const useTriggerPlacementCursorMode = ({
  sceneId,
}: SceneCursorModeContext): SceneCursorMode => {
  const dispatch = useAppDispatch();
  const tool = useAppSelector((state) => state.editor.tool);
  const pasteMode = useAppSelector((state) => state.editor.pasteMode);
  const editorPrefabId = useAppSelector((state) => state.editor.prefabId);
  const entityId = useAppSelector((state) => state.editor.entityId);

  const [isResizing, setIsResizing] = useState(false);

  const resizeRef = useRef<{
    startX: number;
    startY: number;
    currentX?: number;
    currentY?: number;
  }>({
    startX: 0,
    startY: 0,
  });

  const onMouseDown = useCallback<SceneCursorMouseDownHandler>(
    (e) => {
      const { x, y } = e;

      if (pasteMode) {
        dispatch(
          clipboardActions.pasteTriggerAt({
            sceneId,
            x,
            y,
          }),
        );
      } else {
        dispatch(
          entitiesActions.addTrigger({
            sceneId,
            x,
            y,
            width: 1,
            height: 1,
            defaults: editorPrefabId
              ? {
                  prefabId: editorPrefabId,
                }
              : undefined,
          }),
        );
      }

      resizeRef.current.startX = x;
      resizeRef.current.startY = y;
      resizeRef.current.currentX = undefined;
      resizeRef.current.currentY = undefined;
      setIsResizing(true);

      return true;
    },
    [dispatch, editorPrefabId, pasteMode, sceneId],
  );

  const onMouseMove = useCallback<SceneCursorMouseMoveHandler>(
    (e) => {
      if (!isResizing) {
        return false;
      }

      if (tool !== TOOL_TRIGGERS || !e.isOverScene || !entityId) {
        return true;
      }

      const { x, y } = e;

      if (
        resizeRef.current.currentX === x &&
        resizeRef.current.currentY === y
      ) {
        return true;
      }

      dispatch(
        entitiesActions.resizeTrigger({
          triggerId: entityId,
          startX: resizeRef.current.startX,
          startY: resizeRef.current.startY,
          x,
          y,
        }),
      );

      resizeRef.current.currentX = x;
      resizeRef.current.currentY = y;

      return true;
    },
    [dispatch, entityId, isResizing, tool],
  );

  const onMouseUp = useCallback<SceneCursorMouseUpHandler>(() => {
    if (!isResizing) {
      return false;
    }

    setIsResizing(false);
    dispatch(editorActions.setTool({ tool: TOOL_SELECT }));

    return true;
  }, [dispatch, isResizing]);

  const view = useMemo<SceneCursorViewModel>(
    () => ({
      variant: "triggers",
      width: TILE_SIZE,
      height: TILE_SIZE,
      bubble: isResizing ? <ResizeIcon /> : <PlusIcon />,
    }),
    [isResizing],
  );

  return useMemo(
    () => ({
      id: "triggerPlacement",
      enabled: tool === TOOL_TRIGGERS || isResizing,
      viewPriority: 10,
      eventPriority: 10,
      view: tool === TOOL_TRIGGERS ? view : undefined,
      onMouseDown,
      onMouseMove,
      onMouseUp,
    }),
    [isResizing, onMouseDown, onMouseMove, onMouseUp, tool, view],
  );
};
