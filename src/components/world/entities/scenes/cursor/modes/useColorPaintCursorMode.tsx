import React, { useCallback, useMemo, useRef } from "react";
import { BRUSH_FILL, BRUSH_MAGIC, TILE_COLOR_PROPS, TOOL_COLORS } from "consts";
import { PaintIcon } from "ui/icons/Icons";
import {
  backgroundSelectors,
  sceneSelectors,
} from "store/features/entities/entitiesSelectors";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { useAppDispatch, useAppSelector, useAppStore } from "store/hooks";
import type { SceneCursorViewModel } from "../SceneCursorView";
import type {
  SceneCursorMode,
  SceneCursorMouseDownHandler,
  SceneCursorMouseMoveHandler,
  SceneCursorMouseUpHandler,
} from "./SceneCursorMode";
import {
  paintCursorSize,
  resetPaintInteractionForScene,
  resolveAxisLockedLine,
} from "./paintCursorHelpers";

interface ColorPaintState {
  sceneId?: string;
  lockX?: boolean;
  lockY?: boolean;
  startX?: number;
  startY?: number;
  currentX?: number;
  currentY?: number;
  drawLine: boolean;
  drawTile: number;
  isPainting: boolean;
  isTileProp: boolean;
}

export const useColorPaintCursorMode = (): SceneCursorMode => {
  const dispatch = useAppDispatch();
  const store = useAppStore();

  const { tool, selectedBrush, selectedPalette } = useAppSelector(
    (state) => state.editor,
  );

  const stateRef = useRef<ColorPaintState>({
    drawLine: false,
    drawTile: 0,
    isPainting: false,
    isTileProp: false,
  });

  const getPaletteAt = useCallback(
    (sceneId: string, x: number, y: number): number => {
      const rootState = store.getState();
      const scene = sceneSelectors.selectById(rootState, sceneId);
      const background = backgroundSelectors.selectById(
        rootState,
        scene?.backgroundId ?? "",
      );

      if (!background || !scene || !Array.isArray(background.tileColors)) {
        return 0;
      }

      return background.tileColors[x + y * scene.width] ?? 0;
    },
    [store],
  );

  const paintColorAt = useCallback(
    (
      sceneId: string,
      x: number,
      y: number,
      paletteIndex: number,
      isTileProp: boolean,
    ) => {
      const rootState = store.getState();
      const scene = sceneSelectors.selectById(rootState, sceneId);
      const backgroundId = scene?.backgroundId ?? "";
      const tileLookup =
        selectedBrush === BRUSH_MAGIC
          ? rootState.assets.backgrounds[backgroundId]?.lookup
          : undefined;

      dispatch(
        entitiesActions.paintColor({
          brush: selectedBrush,
          sceneId,
          backgroundId,
          x,
          y,
          paletteIndex,
          isTileProp,
          tileLookup,
        }),
      );
    },
    [dispatch, selectedBrush, store],
  );

  const paintColorLine = useCallback(
    (
      sceneId: string,
      startX: number,
      startY: number,
      endX: number,
      endY: number,
      paletteIndex: number,
      isTileProp: boolean,
    ) => {
      const rootState = store.getState();
      const scene = sceneSelectors.selectById(rootState, sceneId);
      const backgroundId = scene?.backgroundId ?? "";
      const tileLookup =
        selectedBrush === BRUSH_MAGIC
          ? rootState.assets.backgrounds[backgroundId]?.lookup
          : undefined;

      dispatch(
        entitiesActions.paintColor({
          brush: selectedBrush,
          sceneId,
          backgroundId,
          x: startX,
          y: startY,
          endX,
          endY,
          paletteIndex,
          isTileProp,
          drawLine: true,
          tileLookup,
        }),
      );
    },
    [dispatch, selectedBrush, store],
  );

  const onMouseDown = useCallback<SceneCursorMouseDownHandler>(
    (e) => {
      if (!e.isOverScene || tool !== TOOL_COLORS) {
        return false;
      }

      const { x, y } = e;
      const sceneId = e.sceneId;
      const rootState = store.getState();
      const scene = sceneSelectors.selectById(rootState, sceneId);
      const backgroundId = scene?.backgroundId ?? "";
      const tileLookup = rootState.assets.backgrounds[backgroundId]?.lookup;
      const state = stateRef.current;

      resetPaintInteractionForScene(state, sceneId);

      if (e.raw.altKey) {
        dispatch(
          editorActions.setSelectedPalette({
            paletteIndex: getPaletteAt(sceneId, x, y),
          }),
        );
        return true;
      }

      if (!scene) {
        return false;
      }

      const hoverPalette = getPaletteAt(sceneId, x, y);

      state.drawLine = e.raw.shiftKey;
      state.lockX = undefined;
      state.lockY = undefined;
      state.currentX = undefined;
      state.currentY = undefined;
      state.drawTile = 0;
      state.isTileProp = !!(selectedPalette & TILE_COLOR_PROPS);

      if (selectedPalette & TILE_COLOR_PROPS) {
        const tileProp = selectedPalette & TILE_COLOR_PROPS;
        const currentProp = hoverPalette & TILE_COLOR_PROPS;

        state.drawTile = currentProp !== tileProp ? tileProp : 0;
      } else {
        state.drawTile = selectedPalette;
      }

      if (selectedBrush === BRUSH_FILL) {
        paintColorAt(sceneId, x, y, state.drawTile, state.isTileProp);
      } else if (selectedBrush === BRUSH_MAGIC) {
        if (tileLookup) {
          dispatch(
            entitiesActions.paintColor({
              brush: "magic",
              sceneId,
              backgroundId,
              tileLookup,
              x,
              y,
              paletteIndex: state.drawTile,
              isTileProp: state.isTileProp,
            }),
          );
        } else {
          dispatch(editorActions.selectScene({ sceneId }));
        }
      } else {
        if (
          state.drawLine &&
          state.startX !== undefined &&
          state.startY !== undefined
        ) {
          paintColorLine(
            sceneId,
            state.startX,
            state.startY,
            x,
            y,
            state.drawTile,
            state.isTileProp,
          );

          state.startX = x;
          state.startY = y;
        } else {
          state.startX = x;
          state.startY = y;
          paintColorAt(sceneId, x, y, state.drawTile, state.isTileProp);
        }

        state.isPainting = true;
      }

      return true;
    },
    [
      dispatch,
      getPaletteAt,
      paintColorAt,
      paintColorLine,
      selectedBrush,
      selectedPalette,
      store,
      tool,
    ],
  );

  const onMouseMove = useCallback<SceneCursorMouseMoveHandler>(
    (e) => {
      const state = stateRef.current;

      if (!state.isPainting) {
        return;
      }

      if (!e.isOverScene) {
        return;
      }

      const { x, y } = e;

      if (state.currentX === x && state.currentY === y) {
        return;
      }

      if (state.startX === undefined || state.startY === undefined) {
        state.startX = x;
        state.startY = y;
      }

      state.drawLine = e.raw.shiftKey;

      if (state.drawLine) {
        const line = resolveAxisLockedLine(
          state,
          state.startX,
          state.startY,
          x,
          y,
        );

        paintColorLine(
          e.sceneId,
          state.startX,
          state.startY,
          line.endX,
          line.endY,
          state.drawTile,
          state.isTileProp,
        );

        state.lockX = line.lockX;
        state.lockY = line.lockY;
        state.startX = line.endX;
        state.startY = line.endY;
      } else {
        paintColorLine(
          e.sceneId,
          state.startX,
          state.startY,
          x,
          y,
          state.drawTile,
          state.isTileProp,
        );

        state.startX = x;
        state.startY = y;
      }

      state.currentX = x;
      state.currentY = y;
    },
    [paintColorLine],
  );

  const resetPaintState = useCallback(() => {
    const state = stateRef.current;

    state.isPainting = false;
    state.lockX = undefined;
    state.lockY = undefined;
  }, []);

  const onMouseUp = useCallback<SceneCursorMouseUpHandler>(() => {
    resetPaintState();
  }, [resetPaintState]);

  const onCancel = resetPaintState;

  const view = useMemo<SceneCursorViewModel>(() => {
    const size = paintCursorSize(selectedBrush);

    return {
      variant: "colors",
      width: size,
      height: size,
      bubble: <PaintIcon />,
    };
  }, [selectedBrush]);

  return useMemo(
    () => ({
      id: "colorPaint",
      enabled: tool === TOOL_COLORS,
      viewPriority: 10,
      eventPriority: 10,
      view,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onCancel,
    }),
    [onCancel, onMouseDown, onMouseMove, onMouseUp, tool, view],
  );
};
