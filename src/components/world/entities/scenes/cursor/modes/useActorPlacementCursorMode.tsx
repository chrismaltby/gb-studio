import React, { useCallback, useMemo } from "react";
import { TILE_SIZE, TOOL_ACTORS, TOOL_SELECT } from "consts";
import { PlusIcon } from "ui/icons/Icons";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import clipboardActions from "store/features/clipboard/clipboardActions";
import { useAppDispatch } from "store/hooks";
import type {
  SceneCursorMode,
  SceneCursorModeContext,
  SceneCursorMouseDownHandler,
} from "./SceneCursorMode";
import type { SceneCursorViewModel } from "../SceneCursorView";

export const useActorPlacementCursorMode = ({
  sceneId,
  x,
  y,
  tool,
  pasteMode,
  editorPrefabId,
}: SceneCursorModeContext): SceneCursorMode => {
  const dispatch = useAppDispatch();

  const onMouseDown = useCallback<SceneCursorMouseDownHandler>(() => {
    if (pasteMode) {
      dispatch(
        clipboardActions.pasteActorAt({
          sceneId,
          x,
          y,
        }),
      );
    } else {
      dispatch(
        entitiesActions.addActor({
          sceneId,
          x,
          y,
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
  }, [dispatch, editorPrefabId, pasteMode, sceneId, x, y]);

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
