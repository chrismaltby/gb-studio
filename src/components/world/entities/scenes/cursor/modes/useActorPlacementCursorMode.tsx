import React, { useCallback, useMemo } from "react";
import { TILE_SIZE, TOOL_ACTORS, TOOL_SELECT } from "consts";
import { PlusIcon } from "ui/icons/Icons";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import clipboardActions from "store/features/clipboard/clipboardActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type {
  SceneCursorMode,
  SceneCursorMouseDownHandler,
} from "./SceneCursorMode";
import type { SceneCursorViewModel } from "../SceneCursorView";

export const useActorPlacementCursorMode = (): SceneCursorMode => {
  const dispatch = useAppDispatch();
  const tool = useAppSelector((state) => state.editor.tool);
  const pasteMode = useAppSelector((state) => state.editor.pasteMode);
  const editorPrefabId = useAppSelector((state) => state.editor.prefabId);

  const onMouseDown = useCallback<SceneCursorMouseDownHandler>(
    (e) => {
      if (pasteMode) {
        dispatch(
          clipboardActions.pasteActorAt({
            sceneId: e.sceneId,
            x: e.x,
            y: e.y,
          }),
        );
      } else {
        dispatch(
          entitiesActions.addActor({
            sceneId: e.sceneId,
            x: e.x,
            y: e.y,
            defaults: editorPrefabId
              ? {
                  prefabId: editorPrefabId,
                }
              : undefined,
          }),
        );
      }

      dispatch(editorActions.setTool({ tool: TOOL_SELECT }));

      return true;
    },
    [dispatch, editorPrefabId, pasteMode],
  );

  const view = useMemo<SceneCursorViewModel>(
    () => ({
      variant: "actors",
      width: TILE_SIZE * 2,
      height: TILE_SIZE,
      bubble: <PlusIcon />,
    }),
    [],
  );

  return useMemo(
    () => ({
      id: "actorPlacement",
      enabled: tool === TOOL_ACTORS,
      viewPriority: 10,
      eventPriority: 10,
      view,
      onMouseDown,
    }),
    [onMouseDown, tool, view],
  );
};
