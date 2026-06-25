import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  BRUSH_SELECTION,
  TILE_SIZE,
  TOOL_COLLISIONS,
  TOOL_COLORS,
} from "consts";
import { sceneSelectors } from "store/features/entities/entitiesSelectors";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type {
  SceneCursorMode,
  SceneCursorModeContext,
  SceneCursorMouseDownHandler,
  SceneCursorMouseMoveHandler,
  SceneCursorMouseUpHandler,
} from "./SceneCursorMode";
import type { SceneGridSelectionMode } from "store/features/editor/editorState";
import type { GridOffset, GridSelection } from "shared/lib/tiles/gridSelection";
import { SelectionIcon } from "ui/icons/Icons";
import { SceneCursorViewModel } from "components/world/entities/scenes/cursor/SceneCursorView";

type SceneGridSelectionInteraction =
  | {
      type: "select";
      originX: number;
      originY: number;
      mode: SceneGridSelectionMode;
    }
  | {
      type: "move";
      startX: number;
      startY: number;
      selection: GridSelection;
      offset: GridOffset;
      mode: SceneGridSelectionMode;
    };

interface SceneGridSelectionState {
  interaction?: SceneGridSelectionInteraction;
}

const ZERO_SELECTION_OFFSET: GridOffset = { x: 0, y: 0 };

const getSelectionMode = (tool: string): SceneGridSelectionMode | undefined => {
  if (tool === TOOL_COLLISIONS) {
    return "collisions";
  }

  if (tool === TOOL_COLORS) {
    return "colors";
  }

  return undefined;
};

const isPointInSelection = (
  x: number,
  y: number,
  selection: GridSelection,
): boolean => {
  return (
    x >= selection.x &&
    y >= selection.y &&
    x < selection.x + selection.width &&
    y < selection.y + selection.height
  );
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const useSceneGridSelectionCursorMode = ({
  enabled,
  sceneId,
}: SceneCursorModeContext): SceneCursorMode => {
  const dispatch = useAppDispatch();

  const { tool, selectedBrush } = useAppSelector((state) => state.editor);

  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, sceneId),
  );

  const scenePaintSelection = useAppSelector((state) => {
    const value = state.editor.scenePaintSelection;
    return value?.sceneId === sceneId ? value : undefined;
  });

  const selectionMode = getSelectionMode(tool);

  const activeScenePaintSelection =
    scenePaintSelection?.mode === selectionMode
      ? scenePaintSelection
      : undefined;

  const selection = activeScenePaintSelection?.selection;

  const stateRef = useRef<SceneGridSelectionState>({});

  const setScenePaintSelection = useCallback(
    (
      next:
        | {
            mode: SceneGridSelectionMode;
            selection: GridSelection;
            offset?: GridOffset;
          }
        | undefined,
    ) => {
      dispatch(
        editorActions.setScenePaintSelection(
          next
            ? {
                sceneId,
                mode: next.mode,
                selection: next.selection,
                offset: next.offset ?? ZERO_SELECTION_OFFSET,
              }
            : undefined,
        ),
      );
    },
    [dispatch, sceneId],
  );

  const resetInteraction = useCallback(() => {
    const interaction = stateRef.current.interaction;
    stateRef.current.interaction = undefined;

    if (interaction?.type === "move") {
      setScenePaintSelection({
        mode: interaction.mode,
        selection: interaction.selection,
        offset: ZERO_SELECTION_OFFSET,
      });
      return;
    }

    if (activeScenePaintSelection) {
      setScenePaintSelection({
        mode: activeScenePaintSelection.mode,
        selection: activeScenePaintSelection.selection,
        offset: ZERO_SELECTION_OFFSET,
      });
    }
  }, [activeScenePaintSelection, setScenePaintSelection]);

  useEffect(() => {
    if (!scenePaintSelection) {
      return;
    }

    if (
      selectedBrush !== BRUSH_SELECTION ||
      !selectionMode ||
      scenePaintSelection.mode !== selectionMode
    ) {
      stateRef.current.interaction = undefined;
      setScenePaintSelection(undefined);
    }
  }, [
    selectedBrush,
    scenePaintSelection,
    selectionMode,
    setScenePaintSelection,
  ]);

  const onMouseDown = useCallback<SceneCursorMouseDownHandler>(
    (e) => {
      if (
        !enabled ||
        !e.isOverScene ||
        selectedBrush !== BRUSH_SELECTION ||
        !selectionMode
      ) {
        return false;
      }

      if (e.raw.nativeEvent.which !== 1) {
        return false;
      }

      if (!scene) {
        return false;
      }

      const x = clamp(e.x, 0, scene.width - 1);
      const y = clamp(e.y, 0, scene.height - 1);

      dispatch(editorActions.selectScene({ sceneId }));

      if (selection && isPointInSelection(x, y, selection)) {
        setScenePaintSelection({
          mode: selectionMode,
          selection,
          offset: ZERO_SELECTION_OFFSET,
        });

        stateRef.current.interaction = {
          type: "move",
          startX: x,
          startY: y,
          selection,
          offset: ZERO_SELECTION_OFFSET,
          mode: selectionMode,
        };

        return true;
      }

      const nextSelection: GridSelection = {
        x,
        y,
        width: 1,
        height: 1,
      };

      stateRef.current.interaction = {
        type: "select",
        originX: x,
        originY: y,
        mode: selectionMode,
      };

      setScenePaintSelection({
        mode: selectionMode,
        selection: nextSelection,
        offset: ZERO_SELECTION_OFFSET,
      });

      return true;
    },
    [
      dispatch,
      enabled,
      scene,
      sceneId,
      selectedBrush,
      selection,
      selectionMode,
      setScenePaintSelection,
    ],
  );

  const onMouseMove = useCallback<SceneCursorMouseMoveHandler>(
    (e) => {
      const interaction = stateRef.current.interaction;

      if (!interaction) {
        return;
      }

      if (!enabled || !e.isOverScene || !scene) {
        return;
      }

      const x = clamp(e.x, 0, scene.width - 1);
      const y = clamp(e.y, 0, scene.height - 1);

      if (interaction.type === "select") {
        setScenePaintSelection({
          mode: interaction.mode,
          selection: {
            x: Math.min(interaction.originX, x),
            y: Math.min(interaction.originY, y),
            width: Math.abs(x - interaction.originX) + 1,
            height: Math.abs(y - interaction.originY) + 1,
          },
          offset: ZERO_SELECTION_OFFSET,
        });

        return;
      }

      const { selection } = interaction;

      const offset: GridOffset = {
        x: clamp(
          x - interaction.startX,
          -selection.x,
          scene.width - selection.x - selection.width,
        ),
        y: clamp(
          y - interaction.startY,
          -selection.y,
          scene.height - selection.y - selection.height,
        ),
      };

      if (
        offset.x === interaction.offset.x &&
        offset.y === interaction.offset.y
      ) {
        return;
      }

      stateRef.current.interaction = {
        ...interaction,
        offset,
      };

      setScenePaintSelection({
        mode: interaction.mode,
        selection,
        offset,
      });
    },
    [enabled, scene, setScenePaintSelection],
  );

  const onMouseUp = useCallback<SceneCursorMouseUpHandler>(() => {
    const interaction = stateRef.current.interaction;

    if (!interaction) {
      return;
    }

    stateRef.current.interaction = undefined;

    if (interaction.type !== "move") {
      return;
    }

    const { offset, selection } = interaction;

    if (offset.x !== 0 || offset.y !== 0) {
      if (interaction.mode === "colors") {
        dispatch(
          entitiesActions.moveSceneColorSelection({
            sceneId,
            selection,
            offset,
          }),
        );
      } else {
        dispatch(
          entitiesActions.moveSceneCollisionSelection({
            sceneId,
            selection,
            offset,
          }),
        );
      }
    }

    setScenePaintSelection({
      mode: interaction.mode,
      selection: {
        ...selection,
        x: selection.x + offset.x,
        y: selection.y + offset.y,
      },
      offset: ZERO_SELECTION_OFFSET,
    });
  }, [dispatch, sceneId, setScenePaintSelection]);

  const onCancel = resetInteraction;

  useEffect(() => {
    if (
      !enabled ||
      selectedBrush !== BRUSH_SELECTION ||
      !activeScenePaintSelection ||
      !selection
    ) {
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Backspace" && e.key !== "Delete") {
        return;
      }

      const target = e.target as HTMLElement | null;
      const isEditableTarget =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (isEditableTarget) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();

      if (activeScenePaintSelection.mode === "colors") {
        dispatch(
          entitiesActions.clearSceneColorSelection({
            sceneId,
            selection,
          }),
        );
      } else {
        dispatch(
          entitiesActions.clearSceneCollisionSelection({
            sceneId,
            selection,
          }),
        );
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [
    activeScenePaintSelection,
    dispatch,
    enabled,
    sceneId,
    selectedBrush,
    selection,
  ]);

  const view = useMemo<SceneCursorViewModel>(() => {
    return {
      variant: "colors",
      width: TILE_SIZE,
      height: TILE_SIZE,
      bubble: <SelectionIcon />,
    };
  }, []);

  return useMemo(
    () => ({
      id: "sceneGridSelection",
      enabled:
        enabled &&
        selectedBrush === BRUSH_SELECTION &&
        (tool === TOOL_COLLISIONS || tool === TOOL_COLORS),
      viewPriority: 20,
      eventPriority: 30,
      view,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onCancel,
    }),
    [
      enabled,
      onCancel,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      selectedBrush,
      tool,
      view,
    ],
  );
};
