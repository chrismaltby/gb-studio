import React, { useMemo } from "react";
import { TILE_SIZE, TOOL_TRIGGERS } from "consts";
import { PlusIcon, ResizeIcon } from "ui/icons/Icons";
import type {
  SceneCursorMode,
  SceneCursorModeContext,
} from "./SceneCursorMode";

export const useTriggerPlacementCursorMode = ({
  tool,
  isResizingTrigger,
}: SceneCursorModeContext): SceneCursorMode => {
  return useMemo(
    () => ({
      id: "triggerPlacement",
      enabled: tool === TOOL_TRIGGERS,
      viewPriority: 10,
      view: {
        variant: "triggers",
        width: TILE_SIZE,
        height: TILE_SIZE,
        bubble: isResizingTrigger ? <ResizeIcon /> : <PlusIcon />,
      },
    }),
    [isResizingTrigger, tool],
  );
};
