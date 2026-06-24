import React, { useMemo } from "react";
import { TOOL_COLLISIONS } from "consts";
import { BrickIcon } from "ui/icons/Icons";
import { useAppSelector } from "store/hooks";
import type { SceneCursorMode } from "./SceneCursorMode";
import { paintCursorSize } from "./helpers";

export const useCollisionPaintCursorMode = (): SceneCursorMode => {
  const tool = useAppSelector((state) => state.editor.tool);
  const brush = useAppSelector((state) => state.editor.selectedBrush);

  return useMemo(() => {
    const size = paintCursorSize(brush);

    return {
      id: "collisionPaint",
      enabled: tool === TOOL_COLLISIONS,
      viewPriority: 10,
      eventPriority: 0,
      view: {
        variant: "collisions",
        width: size,
        height: size,
        bubble: <BrickIcon />,
      },
    };
  }, [brush, tool]);
};
