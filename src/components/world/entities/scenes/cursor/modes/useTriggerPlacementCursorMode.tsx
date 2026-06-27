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
  SceneCursorMouseDownHandler,
  SceneCursorMouseMoveHandler,
  SceneCursorMouseUpHandler,
} from "./SceneCursorMode";

export const useTriggerPlacementCursorMode = (): SceneCursorMode => {
  const dispatch = useAppDispatch();
  const tool = useAppSelector((state) => state.editor.tool);
  const pasteMode = useAppSelector((state) => state.editor.pasteMode);
  const editorPrefabId = useAppSelector((state) => state.editor.prefabId);

  const [isResizing, setIsResizing] = useState(false);

  const resizeRef = useRef<{
    isResizing: boolean;
    triggerId?: string;
    startX: number;
    startY: number;
    currentX?: number;
    currentY?: number;
  }>({
    isResizing: false,
    startX: 0,
    startY: 0,
  });

  const onMouseDown = useCallback<SceneCursorMouseDownHandler>(
    (e) => {
      const { x, y } = e;

      if (pasteMode) {
        dispatch(
          clipboardActions.pasteTriggerAt({
            sceneId: e.sceneId,
            x,
            y,
          }),
        );
        dispatch(editorActions.setTool({ tool: TOOL_SELECT }));
        resizeRef.current.isResizing = false;
        setIsResizing(false);
        resizeRef.current.triggerId = undefined;
      } else {
        const action = entitiesActions.addTrigger({
          sceneId: e.sceneId,
          x,
          y,
          width: 1,
          height: 1,
          defaults: editorPrefabId
            ? {
                prefabId: editorPrefabId,
              }
            : undefined,
        });
        resizeRef.current.triggerId = action.payload.triggerId;
        dispatch(action);
        resizeRef.current.isResizing = true;
        setIsResizing(true);
      }

      resizeRef.current.startX = x;
      resizeRef.current.startY = y;
      resizeRef.current.currentX = undefined;
      resizeRef.current.currentY = undefined;

      return true;
    },
    [dispatch, editorPrefabId, pasteMode],
  );

  const onMouseMove = useCallback<SceneCursorMouseMoveHandler>(
    (e) => {
      if (!resizeRef.current.isResizing) {
        return;
      }

      const triggerId = resizeRef.current.triggerId;

      if (tool !== TOOL_TRIGGERS || !e.isOverScene || !triggerId) {
        return;
      }

      const { x, y } = e;

      if (
        resizeRef.current.currentX === x &&
        resizeRef.current.currentY === y
      ) {
        return;
      }

      dispatch(
        entitiesActions.resizeTrigger({
          triggerId,
          startX: resizeRef.current.startX,
          startY: resizeRef.current.startY,
          x,
          y,
        }),
      );

      resizeRef.current.currentX = x;
      resizeRef.current.currentY = y;
    },
    [dispatch, tool],
  );

  const onMouseUp = useCallback<SceneCursorMouseUpHandler>(() => {
    if (!resizeRef.current.isResizing) {
      return;
    }

    resizeRef.current.isResizing = false;
    resizeRef.current.triggerId = undefined;
    setIsResizing(false);
    dispatch(editorActions.setTool({ tool: TOOL_SELECT }));
  }, [dispatch]);

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
