import React, { useCallback, useMemo, useRef } from "react";
import { BRUSH_FILL, BRUSH_MAGIC, TILE_COLOR_PROPS, TOOL_COLORS } from "consts";
import { PaintIcon } from "ui/icons/Icons";
import {
  backgroundSelectors,
  sceneSelectors,
} from "store/features/entities/entitiesSelectors";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { SceneCursorViewModel } from "../SceneCursorView";
import type {
  SceneCursorMode,
  SceneCursorModeContext,
  SceneCursorMouseDownHandler,
  SceneCursorMouseMoveHandler,
  SceneCursorMouseUpHandler,
} from "./SceneCursorMode";
import { paintCursorSize, resolveAxisLockedLine } from "./paintCursorHelpers";

interface ColorPaintState {
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

export const useColorPaintCursorMode = ({
  enabled,
  sceneId,
}: SceneCursorModeContext): SceneCursorMode => {
  const dispatch = useAppDispatch();

  const { tool, selectedBrush, selectedPalette } = useAppSelector(
    (state) => state.editor,
  );

  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, sceneId),
  );

  const backgroundId = scene?.backgroundId ?? "";

  const background = useAppSelector((state) =>
    backgroundSelectors.selectById(state, backgroundId),
  );

  const tileLookup = useAppSelector((state) =>
    selectedBrush === BRUSH_MAGIC
      ? state.assets.backgrounds[backgroundId]?.lookup
      : undefined,
  );

  const stateRef = useRef<ColorPaintState>({
    drawLine: false,
    drawTile: 0,
    isPainting: false,
    isTileProp: false,
  });

  const getPaletteAt = useCallback(
    (x: number, y: number): number => {
      if (!background || !scene || !Array.isArray(background.tileColors)) {
        return 0;
      }

      return background.tileColors[x + y * scene.width] ?? 0;
    },
    [background, scene],
  );

  const paintColorAt = useCallback(
    (x: number, y: number, paletteIndex: number, isTileProp: boolean) => {
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
    [backgroundId, dispatch, sceneId, selectedBrush, tileLookup],
  );

  const paintColorLine = useCallback(
    (
      startX: number,
      startY: number,
      endX: number,
      endY: number,
      paletteIndex: number,
      isTileProp: boolean,
    ) => {
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
    [backgroundId, dispatch, sceneId, selectedBrush, tileLookup],
  );

  const onMouseDown = useCallback<SceneCursorMouseDownHandler>(
    (e) => {
      if (!enabled || !e.isOverScene || tool !== TOOL_COLORS) {
        return false;
      }

      const { x, y } = e;

      if (e.raw.altKey) {
        dispatch(
          editorActions.setSelectedPalette({
            paletteIndex: getPaletteAt(x, y),
          }),
        );
        return true;
      }

      if (!scene) {
        return false;
      }

      const state = stateRef.current;
      const hoverPalette = getPaletteAt(x, y);

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
        paintColorAt(x, y, state.drawTile, state.isTileProp);
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
          paintColorAt(x, y, state.drawTile, state.isTileProp);
        }

        state.isPainting = true;
      }

      return true;
    },
    [
      backgroundId,
      dispatch,
      enabled,
      getPaletteAt,
      paintColorAt,
      paintColorLine,
      scene,
      sceneId,
      selectedBrush,
      selectedPalette,
      tileLookup,
      tool,
    ],
  );

  const onMouseMove = useCallback<SceneCursorMouseMoveHandler>(
    (e) => {
      const state = stateRef.current;

      if (!state.isPainting) {
        return false;
      }

      if (!enabled || !e.isOverScene || tool !== TOOL_COLORS) {
        return true;
      }

      const { x, y } = e;

      if (state.currentX === x && state.currentY === y) {
        return true;
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

      return true;
    },
    [enabled, paintColorLine, tool],
  );

  const onMouseUp = useCallback<SceneCursorMouseUpHandler>(() => {
    const state = stateRef.current;

    if (!state.isPainting) {
      return false;
    }

    state.isPainting = false;
    state.lockX = undefined;
    state.lockY = undefined;

    return true;
  }, []);

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
    }),
    [onMouseDown, onMouseMove, onMouseUp, tool, view],
  );
};
