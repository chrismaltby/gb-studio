import React, { useMemo } from "react";
import { TOOL_COLORS } from "consts";
import { PaintIcon } from "ui/icons/Icons";
import type { SceneCursorMode } from "./SceneCursorMode";
import { paintCursorSize } from "./helpers";
import { useAppSelector } from "store/hooks";

export const useColorPaintCursorMode = (): SceneCursorMode => {
  const tool = useAppSelector((state) => state.editor.tool);
  const brush = useAppSelector((state) => state.editor.selectedBrush);

  return useMemo(() => {
    const size = paintCursorSize(brush);

    return {
      id: "colorPaint",
      enabled: tool === TOOL_COLORS,
      viewPriority: 10,
      eventPriority: 0,
      view: {
        variant: "colors",
        width: size,
        height: size,
        bubble: <PaintIcon />,
      },
    };
  }, [brush, tool]);
};
