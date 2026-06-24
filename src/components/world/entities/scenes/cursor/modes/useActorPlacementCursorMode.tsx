import React, { useMemo } from "react";
import { TILE_SIZE, TOOL_ACTORS } from "consts";
import { PlusIcon } from "ui/icons/Icons";
import type {
  SceneCursorMode,
  SceneCursorModeContext,
} from "./SceneCursorMode";

export const useActorPlacementCursorMode = ({
  tool,
}: SceneCursorModeContext): SceneCursorMode => {
  return useMemo(
    () => ({
      id: "actorPlacement",
      enabled: tool === TOOL_ACTORS,
      viewPriority: 10,
      eventPriority: 0,
      view: {
        variant: "actors",
        width: TILE_SIZE * 2,
        height: TILE_SIZE,
        bubble: <PlusIcon />,
      },
    }),
    [tool],
  );
};
