import React, { useMemo } from "react";
import { TOOL_COLLISIONS } from "consts";
import { BrickIcon } from "ui/icons/Icons";
import type {
  SceneCursorMode,
  SceneCursorModeContext,
} from "./SceneCursorMode";
import { paintCursorSize } from "./helpers";

export const useCollisionPaintCursorMode = ({
  tool,
  brush,
}: SceneCursorModeContext): SceneCursorMode => {
  return useMemo(() => {
    const size = paintCursorSize(brush);

    return {
      id: "collisionPaint",
      enabled: tool === TOOL_COLLISIONS,
      viewPriority: 10,
      view: {
        variant: "collisions",
        width: size,
        height: size,
        bubble: <BrickIcon />,
      },
    };
  }, [brush, tool]);
};
