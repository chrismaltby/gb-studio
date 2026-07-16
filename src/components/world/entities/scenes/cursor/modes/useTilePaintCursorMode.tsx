import React, { useCallback, useMemo, useRef } from "react";
import {
  BRUSH_FILL,
  BRUSH_MAGIC,
  BRUSH_SELECTION,
  TILE_SIZE,
  TOOL_TILES,
} from "consts";
import { JigsawIcon } from "ui/icons/Icons";
import { sceneSelectors } from "store/features/entities/entitiesSelectors";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { useAppDispatch, useAppSelector, useAppStore } from "store/hooks";
import { sceneStampLinePositions } from "shared/lib/tiles/sceneTilemapData";
import l10n from "shared/lib/lang/l10n";
import type { SceneCursorViewModel } from "../SceneCursorView";
import type {
  SceneCursorMode,
  SceneCursorMouseDownHandler,
  SceneCursorMouseMoveHandler,
  SceneCursorMouseUpHandler,
} from "./SceneCursorMode";

interface TilePaintState {
  sceneId?: string;
  layerId?: string;
  isPainting: boolean;
  originX: number;
  originY: number;
  currentX: number;
  currentY: number;
  lastPaintX: number;
  lastPaintY: number;
  lastDrawX: number;
  lastDrawY: number;
  isErasing: boolean;
  axisLock?: "horizontal" | "vertical";
}

export const useTilePaintCursorMode = (): SceneCursorMode => {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const editor = useAppSelector((state) => state.editor);
  const selectedSceneTile = useMemo(
    () =>
      editor.selectedSceneTile ?? {
        tilesetId: "",
        tileIndex: 0,
        width: 1,
        height: 1,
        tilesetWidth: 0,
        autotile: false,
      },
    [editor.selectedSceneTile],
  );
  const stateRef = useRef<TilePaintState>({
    isPainting: false,
    originX: 0,
    originY: 0,
    currentX: 0,
    currentY: 0,
    lastPaintX: -1,
    lastPaintY: -1,
    lastDrawX: -1,
    lastDrawY: -1,
    isErasing: false,
  });

  const isStamp =
    !editor.scenePaintEraser &&
    (selectedSceneTile.width > 1 || selectedSceneTile.height > 1);

  const paint = useCallback(
    (
      sceneId: string,
      layerId: string,
      startX: number,
      startY: number,
      endX?: number,
      endY?: number,
      erase = editor.scenePaintEraser,
    ) => {
      const drawLine = endX !== undefined && endY !== undefined;
      const payload = {
        sceneId,
        layerId,
        tilesetId: selectedSceneTile.tilesetId,
        tileIndex: selectedSceneTile.tileIndex,
        autotile: selectedSceneTile.autotile,
        erase,
        stamp: {
          width: selectedSceneTile.width,
          height: selectedSceneTile.height,
          tilesetWidth: selectedSceneTile.tilesetWidth,
        },
        brush: editor.selectedBrush,
        x: startX,
        y: startY,
      };
      dispatch(
        entitiesActions.paintSceneTile(
          drawLine ? { ...payload, drawLine: true, endX, endY } : payload,
        ),
      );
    },
    [dispatch, editor, selectedSceneTile],
  );

  const getStampLastPosition = useCallback(
    (
      startX: number,
      startY: number,
      endX: number,
      endY: number,
      erase = editor.scenePaintEraser,
    ) => {
      if (erase || !isStamp) {
        return undefined;
      }

      const positions = sceneStampLinePositions(
        startX,
        startY,
        endX,
        endY,
        selectedSceneTile.width,
        selectedSceneTile.height,
      );

      return positions[positions.length - 1];
    },
    [
      editor.scenePaintEraser,
      isStamp,
      selectedSceneTile.height,
      selectedSceneTile.width,
    ],
  );

  const onMouseDown = useCallback<SceneCursorMouseDownHandler>(
    (e) => {
      if (
        !e.isOverScene ||
        editor.tool !== TOOL_TILES ||
        editor.selectedBrush === BRUSH_SELECTION
      ) {
        return false;
      }

      const scene = sceneSelectors.selectById(store.getState(), e.sceneId);

      if (!scene?.tilemap) {
        dispatch(editorActions.setTool({ tool: "select" }));
        dispatch(editorActions.selectScene({ sceneId: e.sceneId }));
        return true;
      }

      const layer =
        scene.tilemap.layers.find(
          (layer) => layer.id === editor.selectedTilemapLayerId,
        ) ?? scene.tilemap.layers[0];

      if (!layer) {
        return false;
      }

      if (!layer.visible) {
        // eslint-disable-next-line no-alert
        window.alert(l10n("ERROR_SCENE_TARGET_LAYER_HIDDEN"));
        return true;
      }

      const state = stateRef.current;
      const isErasing =
        editor.scenePaintEraser || e.raw.nativeEvent.which === 3;
      const interactionIsStamp = isStamp && !isErasing;
      state.isErasing = isErasing;

      if (state.sceneId !== e.sceneId || state.layerId !== layer.id) {
        state.lastPaintX = -1;
        state.lastPaintY = -1;
        state.lastDrawX = -1;
        state.lastDrawY = -1;
      }
      state.sceneId = e.sceneId;
      state.layerId = layer.id;

      const canDrawShiftLine =
        e.raw.shiftKey &&
        editor.selectedBrush !== BRUSH_FILL &&
        editor.selectedBrush !== BRUSH_MAGIC &&
        state.lastDrawX >= 0 &&
        state.lastDrawY >= 0;
      const stampLastPosition =
        canDrawShiftLine && interactionIsStamp
          ? getStampLastPosition(
              state.lastDrawX,
              state.lastDrawY,
              e.x,
              e.y,
              isErasing,
            )
          : undefined;

      if (canDrawShiftLine && interactionIsStamp && !stampLastPosition) {
        state.lastPaintX = state.lastDrawX;
        state.lastPaintY = state.lastDrawY;
      } else {
        const startX = canDrawShiftLine ? state.lastDrawX : e.x;
        const startY = canDrawShiftLine ? state.lastDrawY : e.y;
        paint(
          e.sceneId,
          layer.id,
          startX,
          startY,
          canDrawShiftLine ? e.x : undefined,
          canDrawShiftLine ? e.y : undefined,
          isErasing,
        );
        state.lastPaintX = stampLastPosition?.x ?? e.x;
        state.lastPaintY = stampLastPosition?.y ?? e.y;
        state.lastDrawX = stampLastPosition?.x ?? e.x;
        state.lastDrawY = stampLastPosition?.y ?? e.y;
      }

      state.originX = e.x;
      state.originY = e.y;
      state.currentX = e.x;
      state.currentY = e.y;
      state.axisLock = undefined;
      state.isPainting =
        editor.selectedBrush !== BRUSH_FILL &&
        editor.selectedBrush !== BRUSH_MAGIC;
      return true;
    },
    [dispatch, editor, getStampLastPosition, isStamp, paint, store],
  );

  const onMouseMove = useCallback<SceneCursorMouseMoveHandler>(
    (e) => {
      const state = stateRef.current;
      if (
        !e.isOverScene ||
        !state.isPainting ||
        !state.sceneId ||
        !state.layerId
      ) {
        return;
      }

      let targetX = e.x;
      let targetY = e.y;
      if (e.raw.shiftKey) {
        const deltaX = e.x - state.originX;
        const deltaY = e.y - state.originY;
        if (!state.axisLock && (deltaX !== 0 || deltaY !== 0)) {
          state.axisLock =
            Math.abs(deltaX) >= Math.abs(deltaY) ? "horizontal" : "vertical";
        }
        if (state.axisLock === "horizontal") targetY = state.originY;
        if (state.axisLock === "vertical") targetX = state.originX;
      } else {
        state.axisLock = undefined;
      }

      if (targetX === state.currentX && targetY === state.currentY) return;
      state.currentX = targetX;
      state.currentY = targetY;

      const startX = state.lastPaintX >= 0 ? state.lastPaintX : targetX;
      const startY = state.lastPaintY >= 0 ? state.lastPaintY : targetY;
      const interactionIsStamp = isStamp && !state.isErasing;
      const stampLastPosition = getStampLastPosition(
        startX,
        startY,
        targetX,
        targetY,
        state.isErasing,
      );

      if (!interactionIsStamp || stampLastPosition) {
        paint(
          state.sceneId,
          state.layerId,
          startX,
          startY,
          targetX,
          targetY,
          state.isErasing,
        );
        state.lastPaintX = stampLastPosition?.x ?? targetX;
        state.lastPaintY = stampLastPosition?.y ?? targetY;
        state.lastDrawX = stampLastPosition?.x ?? targetX;
        state.lastDrawY = stampLastPosition?.y ?? targetY;
      }
    },
    [getStampLastPosition, isStamp, paint],
  );

  const reset = useCallback(() => {
    stateRef.current.isPainting = false;
    stateRef.current.axisLock = undefined;
    stateRef.current.lastPaintX = -1;
    stateRef.current.lastPaintY = -1;
  }, []);

  const onMouseUp = useCallback<SceneCursorMouseUpHandler>(
    () => reset(),
    [reset],
  );

  const view = useMemo<SceneCursorViewModel>(() => {
    const stampWidth = isStamp ? selectedSceneTile.width : 1;
    const stampHeight = isStamp ? selectedSceneTile.height : 1;
    const brushSize = editor.selectedBrush === "16px" ? 2 : 1;
    return {
      variant: "tiles",
      width: TILE_SIZE * (isStamp ? stampWidth : brushSize),
      height: TILE_SIZE * (isStamp ? stampHeight : brushSize),
      bubble: <JigsawIcon />,
    };
  }, [
    editor.selectedBrush,
    isStamp,
    selectedSceneTile.height,
    selectedSceneTile.width,
  ]);

  return useMemo(
    () => ({
      id: "tilePaint",
      enabled:
        editor.tool === TOOL_TILES && editor.selectedBrush !== BRUSH_SELECTION,
      viewPriority: 10,
      eventPriority: 10,
      view,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onCancel: reset,
    }),
    [
      editor.selectedBrush,
      editor.tool,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      reset,
      view,
    ],
  );
};
