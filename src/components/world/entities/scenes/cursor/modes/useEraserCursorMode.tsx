import React, { useMemo } from "react";
import { TOOL_ERASER } from "consts";
import { CloseIcon } from "ui/icons/Icons";
import type {
  SceneCursorMode,
  SceneCursorModeContext,
} from "./SceneCursorMode";
import { paintCursorSize } from "./helpers";

export const useEraserCursorMode = ({
  tool,
  brush,
}: SceneCursorModeContext): SceneCursorMode => {
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
