import React, { useMemo } from "react";
import { TOOL_ERASER } from "consts";
import { CloseIcon } from "ui/icons/Icons";
import type { SceneCursorMode } from "./SceneCursorMode";
import { paintCursorSize } from "./helpers";
import { useAppSelector } from "store/hooks";

export const useEraserCursorMode = (): SceneCursorMode => {
  const tool = useAppSelector((state) => state.editor.tool);
  const brush = useAppSelector((state) => state.editor.selectedBrush);

  return useMemo(() => {
    const size = paintCursorSize(brush);

    return {
      id: "eraser",
      enabled: tool === TOOL_ERASER,
      viewPriority: 10,
      eventPriority: 0,
      view: {
        variant: "eraser",
        width: size,
        height: size,
        bubble: <CloseIcon />,
      },
    };
  }, [brush, tool]);
};
