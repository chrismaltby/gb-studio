import React, { useMemo } from "react";
import { TOOL_COLORS } from "consts";
import { PaintIcon } from "ui/icons/Icons";
import type {
  SceneCursorMode,
  SceneCursorModeContext,
} from "./SceneCursorMode";
import { paintCursorSize } from "./helpers";

export const useColorPaintCursorMode = ({
  tool,
  brush,
}: SceneCursorModeContext): SceneCursorMode => {
  return useMemo(() => {
    const size = paintCursorSize(brush);

    return {
      id: "colorPaint",
      enabled: tool === TOOL_COLORS,
      viewPriority: 10,
      view: {
        variant: "colors",
        width: size,
        height: size,
        bubble: <PaintIcon />,
      },
    };
  }, [brush, tool]);
};
