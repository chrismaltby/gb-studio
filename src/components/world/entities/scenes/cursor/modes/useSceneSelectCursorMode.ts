import { useCallback, useMemo } from "react";
import { TOOL_SELECT } from "consts";
import editorActions from "store/features/editor/editorActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type {
  SceneCursorMode,
  SceneCursorMouseDownHandler,
} from "./SceneCursorMode";

export const useSceneSelectCursorMode = (): SceneCursorMode => {
  const dispatch = useAppDispatch();
  const tool = useAppSelector((state) => state.editor.tool);

  const onMouseDown = useCallback<SceneCursorMouseDownHandler>(
    (e) => {
      if (tool !== TOOL_SELECT) {
        return false;
      }

      dispatch(editorActions.selectScene({ sceneId: e.sceneId }));

      return true;
    },
    [dispatch, tool],
  );

  return useMemo(
    () => ({
      id: "sceneSelect",
      enabled: tool === TOOL_SELECT,
      viewPriority: -1000,
      eventPriority: 0,
      onMouseDown,
    }),
    [onMouseDown, tool],
  );
};
