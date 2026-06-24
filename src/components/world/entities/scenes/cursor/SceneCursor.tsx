import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  backgroundSelectors,
  sceneSelectors,
} from "store/features/entities/entitiesSelectors";
import editorActions from "store/features/editor/editorActions";
import settingsActions from "store/features/settings/settingsActions";
import entitiesActions from "store/features/entities/entitiesActions";
import {
  BRUSH_FILL,
  BRUSH_MAGIC,
  BRUSH_16PX,
  TOOL_SELECT,
  MIDDLE_MOUSE,
  TILE_COLOR_PROPS,
} from "consts";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { SceneCursorView } from "./SceneCursorView";
import {
  getSceneCursorEventModes,
  getSceneCursorView,
} from "./modes/SceneCursorMode";
import type {
  SceneCursorEvent,
  SceneCursorMode,
} from "./modes/SceneCursorMode";
import { useActorPlacementCursorMode } from "./modes/useActorPlacementCursorMode";
import { useCollisionPaintCursorMode } from "./modes/useCollisionPaintCursorMode";
import { useColorPaintCursorMode } from "./modes/useColorPaintCursorMode";
import { useDefaultCursorMode } from "./modes/useDefaultCursorMode";
import { useEraserCursorMode } from "./modes/useEraserCursorMode";
import { useTriggerPlacementCursorMode } from "./modes/useTriggerPlacementCursorMode";

interface SceneCursorProps {
  sceneId: string;
  sceneFiltered: boolean;
  enabled: boolean;
}

const SceneCursor = ({ sceneId, enabled, sceneFiltered }: SceneCursorProps) => {
  const dispatch = useAppDispatch();
  const {
    x,
    y,
    sceneId: hoverSceneId,
  } = useAppSelector((state) => state.editor.hover);

  const { tool, selectedBrush, selectedPalette, showLayers } = useAppSelector(
    (state) => state.editor,
  );

  const showCollisions = useAppSelector(
    (state) => state.project.present.settings.showCollisions,
  );

  const cursorRef = useRef<HTMLDivElement>(null);

  const getCursorRect = useCallback(
    () => cursorRef.current?.getBoundingClientRect(),
    [],
  );

  const cursorModeContext = useMemo(
    () => ({
      enabled,
      sceneId,
      hoverSceneId,
      x,
      y,
      getCursorRect,
    }),
    [enabled, getCursorRect, hoverSceneId, sceneId, x, y],
  );

  const actorPlacementCursorMode =
    useActorPlacementCursorMode(cursorModeContext);
  const triggerPlacementCursorMode =
    useTriggerPlacementCursorMode(cursorModeContext);
  const collisionPaintCursorMode =
    useCollisionPaintCursorMode(cursorModeContext);
  const colorPaintCursorMode = useColorPaintCursorMode();
  const eraserCursorMode = useEraserCursorMode();
  const defaultCursorMode = useDefaultCursorMode();

  const cursorModes = useMemo(
    () => [
      actorPlacementCursorMode,
      triggerPlacementCursorMode,
      collisionPaintCursorMode,
      colorPaintCursorMode,
      eraserCursorMode,
      defaultCursorMode,
    ],
    [
      actorPlacementCursorMode,
      triggerPlacementCursorMode,
      collisionPaintCursorMode,
      colorPaintCursorMode,
      eraserCursorMode,
      defaultCursorMode,
    ],
  );

  const cursorView = useMemo(
    () => getSceneCursorView(cursorModes),
    [cursorModes],
  );

  const data = useRef<{
    lockX?: boolean;
    lockY?: boolean;
    startX: number;
    startY: number;
    currentX?: number;
    currentY?: number;
    drawLine: boolean;
    drawTile: number;
    mask: number;
    isPainting: boolean;
    isTileProp: boolean;
  }>({
    startX: 0,
    startY: 0,
    drawLine: false,
    drawTile: 0,
    mask: 0xff,
    isPainting: false,
    isTileProp: false,
  });

  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, hoverSceneId),
  );

  const backgroundId = scene?.backgroundId ?? "";

  const background = useAppSelector((state) =>
    backgroundSelectors.selectById(state, backgroundId),
  );

  const hoverPalette =
    background && scene && Array.isArray(background.tileColors)
      ? background.tileColors[x + y * scene.width] || 0
      : 0;

  const tileLookup = useAppSelector((state) =>
    selectedBrush === BRUSH_MAGIC
      ? state.assets.backgrounds[background?.id ?? ""]?.lookup
      : undefined,
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      if (e.target.nodeName !== "BODY") {
        return;
      }
      if (e.shiftKey) {
        data.current.drawLine = true;
      }
      if (e.ctrlKey || e.shiftKey || e.metaKey) {
        return;
      }
      if (e.code === "KeyP") {
        if (enabled) {
          dispatch(settingsActions.editPlayerStartAt({ sceneId, x, y }));
          dispatch(editorActions.setTool({ tool: TOOL_SELECT }));
        }
      }
    },
    [dispatch, enabled, sceneId, x, y],
  );

  const onKeyUp = useCallback((e: KeyboardEvent) => {
    if (!(e.target instanceof HTMLElement)) return;
    if (e.target.nodeName !== "BODY") {
      return;
    }
    if (!e.shiftKey) {
      data.current.drawLine = false;
    }
  }, []);

  // Keyboard handlers
  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [onKeyDown, onKeyUp]);

  const onMouseMoveCollisions = useCallback(() => {
    if (!enabled) {
      return;
    }

    if (data.current.currentX !== x || data.current.currentY !== y) {
      if (data.current.drawLine) {
        if (
          data.current.startX === undefined ||
          data.current.startY === undefined
        ) {
          data.current.startX = x;
          data.current.startY = y;
        }
        let x1 = x;
        let y1 = y;
        if (data.current.lockX) {
          x1 = data.current.startX;
        } else if (data.current.lockY) {
          y1 = data.current.startY;
        } else if (x !== data.current.startX) {
          data.current.lockY = true;
          y1 = data.current.startY;
        } else if (y !== data.current.startY) {
          data.current.lockX = true;
          x1 = data.current.startX;
        }
        dispatch(
          entitiesActions.paintCollision({
            brush: selectedBrush,
            sceneId,
            x: data.current.startX,
            y: data.current.startY,
            endX: x1,
            endY: y1,
            value: data.current.drawTile,
            mask: data.current.mask,
            drawLine: true,
            tileLookup,
          }),
        );
        data.current.startX = x1;
        data.current.startY = y1;
      } else {
        if (
          data.current.startX === undefined ||
          data.current.startY === undefined
        ) {
          data.current.startX = x;
          data.current.startY = y;
        }
        const x1 = x;
        const y1 = y;
        dispatch(
          entitiesActions.paintCollision({
            brush: selectedBrush,
            sceneId,
            x: data.current.startX,
            y: data.current.startY,
            endX: x1,
            endY: y1,
            value: data.current.drawTile,
            mask: data.current.mask,
            drawLine: true,
            tileLookup,
          }),
        );

        data.current.startX = x1;
        data.current.startY = y1;
      }
      data.current.currentX = x;
      data.current.currentY = y;
    }
  }, [dispatch, enabled, sceneId, selectedBrush, tileLookup, x, y]);

  const onMouseMoveColors = useCallback(() => {
    if (
      enabled &&
      (data.current.currentX !== x || data.current.currentY !== y)
    ) {
      if (data.current.drawLine) {
        if (
          data.current.startX === undefined ||
          data.current.startY === undefined
        ) {
          data.current.startX = x;
          data.current.startY = y;
        }
        let x1 = x;
        let y1 = y;
        if (data.current.lockX) {
          x1 = data.current.startX;
        } else if (data.current.lockY) {
          y1 = data.current.startY;
        } else if (x !== data.current.startX) {
          data.current.lockY = true;
          y1 = data.current.startY;
        } else if (y !== data.current.startY) {
          data.current.lockX = true;
          x1 = data.current.startX;
        }
        dispatch(
          entitiesActions.paintColor({
            brush: selectedBrush,
            sceneId,
            backgroundId,
            x: data.current.startX,
            y: data.current.startY,
            endX: x1,
            endY: y1,
            paletteIndex: data.current.drawTile,
            isTileProp: data.current.isTileProp,
            drawLine: true,
            tileLookup,
          }),
        );
        data.current.startX = x1;
        data.current.startY = y1;
      } else {
        if (
          data.current.startX === undefined ||
          data.current.startY === undefined
        ) {
          data.current.startX = x;
          data.current.startY = y;
        }
        const x1 = x;
        const y1 = y;
        dispatch(
          entitiesActions.paintColor({
            brush: selectedBrush,
            sceneId,
            backgroundId,
            x: data.current.startX,
            y: data.current.startY,
            endX: x1,
            endY: y1,
            paletteIndex: data.current.drawTile,
            isTileProp: data.current.isTileProp,
            drawLine: true,
            tileLookup,
          }),
        );
        data.current.startX = x1;
        data.current.startY = y1;
      }
      data.current.currentX = x;
      data.current.currentY = y;
    }
  }, [
    backgroundId,
    dispatch,
    enabled,
    sceneId,
    selectedBrush,
    tileLookup,
    x,
    y,
  ]);

  const onLegacyMouseMove = useCallback(() => {
    if (sceneId !== hoverSceneId) {
      return;
    }
    if (
      data.current.isPainting &&
      (tool === "collisions" || tool === "eraser")
    ) {
      onMouseMoveCollisions();
    } else if (data.current.isPainting && tool === "colors") {
      onMouseMoveColors();
    }
  }, [hoverSceneId, onMouseMoveCollisions, onMouseMoveColors, sceneId, tool]);

  const onLegacyMouseUp = useCallback(() => {
    data.current.isPainting = false;
  }, []);

  const onMouseDownColors = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (e.altKey) {
        dispatch(
          editorActions.setSelectedPalette({ paletteIndex: hoverPalette }),
        );
        return;
      }

      data.current.drawTile = 0;
      data.current.isTileProp = !!(selectedPalette & TILE_COLOR_PROPS);

      // If any tile under brush is currently not filled then
      // paint tileColors rather than remove them
      if (selectedPalette & TILE_COLOR_PROPS) {
        // If drawing props replace but keep tileColors
        const tileProp = selectedPalette & TILE_COLOR_PROPS;
        const currentProp = hoverPalette & TILE_COLOR_PROPS;
        if (currentProp !== tileProp) {
          data.current.drawTile = tileProp;
        } else {
          data.current.drawTile = 0;
        }
      } else {
        data.current.drawTile = selectedPalette;
      }

      if (selectedBrush === BRUSH_FILL) {
        dispatch(
          entitiesActions.paintColor({
            brush: selectedBrush,
            sceneId,
            backgroundId,
            x,
            y,
            paletteIndex: data.current.drawTile,
            isTileProp: data.current.isTileProp,
            tileLookup,
          }),
        );
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
              paletteIndex: data.current.drawTile,
              isTileProp: data.current.isTileProp,
            }),
          );
        } else {
          dispatch(editorActions.selectScene({ sceneId }));
        }
      } else {
        if (
          data.current.drawLine &&
          data.current.startX !== undefined &&
          data.current.startY !== undefined
        ) {
          dispatch(
            entitiesActions.paintColor({
              brush: selectedBrush,
              sceneId,
              backgroundId,
              x: data.current.startX,
              y: data.current.startY,
              endX: x,
              endY: y,
              paletteIndex: data.current.drawTile,
              drawLine: true,
              isTileProp: data.current.isTileProp,
              tileLookup,
            }),
          );
          data.current.startX = x;
          data.current.startY = y;
        } else {
          data.current.startX = x;
          data.current.startY = y;
          dispatch(
            entitiesActions.paintColor({
              brush: selectedBrush,
              sceneId,
              backgroundId,
              x,
              y,
              paletteIndex: data.current.drawTile,
              isTileProp: data.current.isTileProp,
              tileLookup,
            }),
          );
        }
        data.current.isPainting = true;
      }
    },
    [
      backgroundId,
      dispatch,
      hoverPalette,
      sceneId,
      selectedBrush,
      selectedPalette,
      tileLookup,
      x,
      y,
    ],
  );

  const onMouseDownEraser = useCallback(() => {
    if (showCollisions) {
      data.current.drawTile = 0;
      if (selectedBrush === BRUSH_FILL) {
        dispatch(
          entitiesActions.paintCollision({
            brush: selectedBrush,
            sceneId,
            x,
            y,
            value: data.current.drawTile,
            mask: 0xff,
            tileLookup,
          }),
        );
      } else if (selectedBrush === BRUSH_MAGIC) {
        if (tileLookup) {
          dispatch(
            entitiesActions.paintCollision({
              brush: selectedBrush,
              sceneId,
              tileLookup,
              x,
              y,
              value: 0,
              mask: 0xff,
            }),
          );
        } else {
          dispatch(editorActions.selectScene({ sceneId }));
        }
      } else {
        if (
          data.current.drawLine &&
          data.current.startX !== undefined &&
          data.current.startY !== undefined
        ) {
          dispatch(
            entitiesActions.paintCollision({
              brush: selectedBrush,
              sceneId,
              x: data.current.startX,
              y: data.current.startY,
              endX: x,
              endY: y,
              value: 0,
              mask: 0xff,
              drawLine: true,
              tileLookup,
            }),
          );
          data.current.startX = x;
          data.current.startY = y;
        } else {
          data.current.startX = x;
          data.current.startY = y;
          dispatch(
            entitiesActions.paintCollision({
              brush: selectedBrush,
              sceneId,
              x,
              y,
              value: 0,
              mask: 0xff,
              tileLookup,
            }),
          );
        }
        data.current.isPainting = true;
      }
    }
    if (showLayers) {
      dispatch(entitiesActions.removeActorAt({ sceneId, x, y }));
      dispatch(entitiesActions.removeTriggerAt({ sceneId, x, y }));
      if (selectedBrush === BRUSH_16PX) {
        dispatch(entitiesActions.removeActorAt({ sceneId, x: x + 1, y }));
        dispatch(entitiesActions.removeTriggerAt({ sceneId, x: x + 1, y }));
        dispatch(entitiesActions.removeActorAt({ sceneId, x, y: y + 1 }));
        dispatch(entitiesActions.removeTriggerAt({ sceneId, x, y: y + 1 }));
        dispatch(
          entitiesActions.removeActorAt({ sceneId, x: x + 1, y: y + 1 }),
        );
        dispatch(
          entitiesActions.removeTriggerAt({ sceneId, x: x + 1, y: y + 1 }),
        );
      }
    }
  }, [
    dispatch,
    sceneId,
    selectedBrush,
    showCollisions,
    showLayers,
    tileLookup,
    x,
    y,
  ]);

  const createCursorEvent = useCallback(
    <T,>(raw: T): SceneCursorEvent<T> => ({
      x,
      y,
      sceneId,
      isOverScene: sceneId === hoverSceneId,
      raw,
    }),
    [hoverSceneId, sceneId, x, y],
  );

  const prepareCursorMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!scene) {
        return false;
      }

      if (e.nativeEvent.which === MIDDLE_MOUSE) {
        return false;
      }

      if (!e.shiftKey) {
        data.current.drawLine = false;
      }

      data.current.lockX = undefined;
      data.current.lockY = undefined;

      // If clicked scene was filtered out using search
      // clear search term so scene will become fully visible again
      if (sceneFiltered) {
        dispatch(editorActions.editSearchTerm(""));
      }

      return true;
    },
    [dispatch, scene, sceneFiltered],
  );

  const onLegacyMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (tool === "collisions") {
        if (e.nativeEvent.which === 3) {
          // right mouse always erase
          onMouseDownEraser();
        }
      } else if (tool === "colors") {
        onMouseDownColors(e);
      } else if (tool === "eraser") {
        onMouseDownEraser();
      } else if (tool === "select") {
        dispatch(editorActions.selectScene({ sceneId }));
      }
    },
    [dispatch, onMouseDownColors, onMouseDownEraser, sceneId, tool],
  );

  const legacyCursorEventMode = useMemo<SceneCursorMode>(
    () => ({
      id: "legacySceneCursorEvents",
      enabled: true,
      viewPriority: -1000,
      eventPriority: -1000,
      onMouseDown: (e) => {
        onLegacyMouseDown(e.raw);
        return true;
      },
      onMouseMove: () => {
        onLegacyMouseMove();
        return true;
      },
      onMouseUp: () => {
        onLegacyMouseUp();
        return true;
      },
    }),
    [onLegacyMouseDown, onLegacyMouseMove, onLegacyMouseUp],
  );

  const eventModes = useMemo(
    () => getSceneCursorEventModes([...cursorModes, legacyCursorEventMode]),
    [cursorModes, legacyCursorEventMode],
  );

  const onMouseDown = useCallback(
    (raw: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!prepareCursorMouseDown(raw)) {
        return;
      }

      const e = createCursorEvent(raw);

      for (const mode of eventModes) {
        if (mode.onMouseDown?.(e)) {
          return;
        }
      }
    },
    [createCursorEvent, eventModes, prepareCursorMouseDown],
  );

  const onWindowMouseMove = useCallback(
    (raw: MouseEvent) => {
      const e = createCursorEvent(raw);

      for (const mode of eventModes) {
        if (mode.onMouseMove?.(e)) {
          return;
        }
      }
    },
    [createCursorEvent, eventModes],
  );

  const onWindowMouseUp = useCallback(
    (raw: MouseEvent) => {
      const e = createCursorEvent(raw);

      for (const mode of eventModes) {
        if (mode.onMouseUp?.(e)) {
          return;
        }
      }
    },
    [createCursorEvent, eventModes],
  );

  useEffect(() => {
    window.addEventListener("mousemove", onWindowMouseMove);
    window.addEventListener("mouseup", onWindowMouseUp);
    return () => {
      window.removeEventListener("mousemove", onWindowMouseMove);
      window.removeEventListener("mouseup", onWindowMouseUp);
    };
  }, [onWindowMouseMove, onWindowMouseUp]);

  if (!enabled) {
    return <div />;
  }
  return (
    <SceneCursorView
      ref={cursorRef}
      x={x}
      y={y}
      view={cursorView}
      onMouseDown={onMouseDown}
    />
  );
};

export default SceneCursor;
