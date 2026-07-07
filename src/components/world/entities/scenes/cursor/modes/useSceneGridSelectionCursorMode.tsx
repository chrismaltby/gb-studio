import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  BRUSH_SELECTION,
  TILE_SIZE,
  TOOL_COLLISIONS,
  TOOL_COLORS,
  TOOL_TILES,
} from "consts";
import { sceneSelectors } from "store/features/entities/entitiesSelectors";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { useAppDispatch, useAppSelector, useAppStore } from "store/hooks";
import type {
  SceneCursorMode,
  SceneCursorMouseDownHandler,
  SceneCursorMouseMoveHandler,
  SceneCursorMouseUpHandler,
} from "./SceneCursorMode";
import type { SceneGridSelectionMode } from "store/features/editor/editorState";
import type { GridOffset, GridSelection } from "shared/lib/tiles/grid";
import { SelectionIcon } from "ui/icons/Icons";
import { SceneCursorViewModel } from "components/world/entities/scenes/cursor/SceneCursorView";

type SceneGridSelectionInteraction =
  | {
      type: "select";
      originX: number;
      originY: number;
      sceneId: string;
      layerId?: string;
      mode: SceneGridSelectionMode;
    }
  | {
      type: "move";
      startX: number;
      startY: number;
      selection: GridSelection;
      offset: GridOffset;
      sceneId: string;
      layerId?: string;
      mode: SceneGridSelectionMode;
    };

interface SceneGridSelectionState {
  interaction?: SceneGridSelectionInteraction;
}

const ZERO_SELECTION_OFFSET: GridOffset = { x: 0, y: 0 };

const getSelectionMode = (tool: string): SceneGridSelectionMode | undefined => {
  if (tool === TOOL_TILES) {
    return "tiles";
  }

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

export const useSceneGridSelectionCursorMode = (): SceneCursorMode => {
  const dispatch = useAppDispatch();
  const store = useAppStore();

  const { tool, selectedBrush, selectedTilemapLayerId } = useAppSelector(
    (state) => state.editor,
  );

  const scenePaintSelection = useAppSelector(
    (state) => state.editor.scenePaintSelection,
  );

  const selectionMode = getSelectionMode(tool);

  const activeScenePaintSelection =
    scenePaintSelection?.mode === selectionMode
      ? scenePaintSelection
      : undefined;

  const stateRef = useRef<SceneGridSelectionState>({});

  const setScenePaintSelection = useCallback(
    (
      sceneId: string,
      next:
        | {
            mode: SceneGridSelectionMode;
            selection: GridSelection;
            offset?: GridOffset;
            layerId?: string;
          }
        | undefined,
    ) => {
      dispatch(
        editorActions.setScenePaintSelection(
          next
            ? {
                sceneId,
                layerId: next.layerId,
                mode: next.mode,
                selection: next.selection,
                offset: next.offset ?? ZERO_SELECTION_OFFSET,
              }
            : undefined,
        ),
      );
    },
    [dispatch],
  );

  const resetInteraction = useCallback(() => {
    const interaction = stateRef.current.interaction;
    stateRef.current.interaction = undefined;

    if (interaction?.type === "move") {
      setScenePaintSelection(interaction.sceneId, {
        mode: interaction.mode,
        selection: interaction.selection,
        offset: ZERO_SELECTION_OFFSET,
        layerId: interaction.mode === "tiles" ? interaction.layerId : undefined,
      });
      return;
    }

    if (activeScenePaintSelection) {
      setScenePaintSelection(activeScenePaintSelection.sceneId, {
        mode: activeScenePaintSelection.mode,
        selection: activeScenePaintSelection.selection,
        offset: ZERO_SELECTION_OFFSET,
        layerId: activeScenePaintSelection.layerId,
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
      setScenePaintSelection(scenePaintSelection.sceneId, undefined);
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
        !e.isOverScene ||
        selectedBrush !== BRUSH_SELECTION ||
        !selectionMode
      ) {
        return false;
      }

      if (e.raw.nativeEvent.which !== 1) {
        return false;
      }

      const scene = sceneSelectors.selectById(store.getState(), e.sceneId);

      if (!scene) {
        return false;
      }

      const x = clamp(e.x, 0, scene.width - 1);
      const y = clamp(e.y, 0, scene.height - 1);

      dispatch(editorActions.selectScene({ sceneId: e.sceneId }));

      const sceneSelection =
        activeScenePaintSelection?.sceneId === e.sceneId &&
        (selectionMode !== "tiles" ||
          activeScenePaintSelection.layerId === selectedTilemapLayerId)
          ? activeScenePaintSelection.selection
          : undefined;

      const layerId =
        selectionMode === "tiles" ? selectedTilemapLayerId : undefined;

      if (
        selectionMode === "tiles" &&
        (!layerId ||
          !scene.tilemap?.layers.some((layer) => layer.id === layerId))
      ) {
        return false;
      }

      if (sceneSelection && isPointInSelection(x, y, sceneSelection)) {
        setScenePaintSelection(e.sceneId, {
          mode: selectionMode,
          selection: sceneSelection,
          offset: ZERO_SELECTION_OFFSET,
          layerId,
        });

        stateRef.current.interaction = {
          type: "move",
          startX: x,
          startY: y,
          selection: sceneSelection,
          offset: ZERO_SELECTION_OFFSET,
          sceneId: e.sceneId,
          layerId,
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
        sceneId: e.sceneId,
        layerId,
        mode: selectionMode,
      };

      setScenePaintSelection(e.sceneId, {
        mode: selectionMode,
        selection: nextSelection,
        offset: ZERO_SELECTION_OFFSET,
        layerId,
      });

      return true;
    },
    [
      dispatch,
      activeScenePaintSelection,
      selectedBrush,
      selectionMode,
      selectedTilemapLayerId,
      setScenePaintSelection,
      store,
    ],
  );

  const onMouseMove = useCallback<SceneCursorMouseMoveHandler>(
    (e) => {
      const interaction = stateRef.current.interaction;

      if (!interaction) {
        return;
      }

      const scene = sceneSelectors.selectById(
        store.getState(),
        interaction.sceneId,
      );

      if (!e.isOverScene || !scene) {
        return;
      }

      const x = clamp(e.x, 0, scene.width - 1);
      const y = clamp(e.y, 0, scene.height - 1);

      if (interaction.type === "select") {
        setScenePaintSelection(interaction.sceneId, {
          mode: interaction.mode,
          selection: {
            x: Math.min(interaction.originX, x),
            y: Math.min(interaction.originY, y),
            width: Math.abs(x - interaction.originX) + 1,
            height: Math.abs(y - interaction.originY) + 1,
          },
          offset: ZERO_SELECTION_OFFSET,
          layerId:
            interaction.mode === "tiles" ? interaction.layerId : undefined,
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
        layerId: interaction.mode === "tiles" ? interaction.layerId : undefined,
      };

      setScenePaintSelection(interaction.sceneId, {
        mode: interaction.mode,
        selection,
        offset,
        layerId: interaction.mode === "tiles" ? interaction.layerId : undefined,
      });
    },
    [setScenePaintSelection, store],
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
      if (interaction.mode === "tiles") {
        if (!interaction.layerId) {
          return;
        }
        dispatch(
          entitiesActions.moveSceneTileSelection({
            sceneId: interaction.sceneId,
            layerId: interaction.layerId,
            selection,
            offset,
          }),
        );
      } else if (interaction.mode === "colors") {
        dispatch(
          entitiesActions.moveSceneColorSelection({
            sceneId: interaction.sceneId,
            selection,
            offset,
          }),
        );
      } else {
        dispatch(
          entitiesActions.moveSceneCollisionSelection({
            sceneId: interaction.sceneId,
            selection,
            offset,
          }),
        );
      }
    }

    setScenePaintSelection(interaction.sceneId, {
      mode: interaction.mode,
      selection: {
        ...selection,
        x: selection.x + offset.x,
        y: selection.y + offset.y,
      },
      offset: ZERO_SELECTION_OFFSET,
      layerId: interaction.mode === "tiles" ? interaction.layerId : undefined,
    });
  }, [dispatch, setScenePaintSelection]);

  const onCancel = resetInteraction;

  useEffect(() => {
    if (
      scenePaintSelection?.mode === "tiles" &&
      scenePaintSelection.layerId !== selectedTilemapLayerId
    ) {
      stateRef.current.interaction = undefined;
      setScenePaintSelection(scenePaintSelection.sceneId, undefined);
    }
  }, [scenePaintSelection, selectedTilemapLayerId, setScenePaintSelection]);

  const view = useMemo<SceneCursorViewModel>(() => {
    return {
      variant: "selection",
      width: TILE_SIZE,
      height: TILE_SIZE,
      bubble: <SelectionIcon />,
    };
  }, []);

  return useMemo(
    () => ({
      id: "sceneGridSelection",
      enabled:
        selectedBrush === BRUSH_SELECTION &&
        (tool === TOOL_COLLISIONS ||
          tool === TOOL_COLORS ||
          tool === TOOL_TILES),
      viewPriority: 20,
      eventPriority: 30,
      view,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onCancel,
    }),
    [onCancel, onMouseDown, onMouseMove, onMouseUp, selectedBrush, tool, view],
  );
};
