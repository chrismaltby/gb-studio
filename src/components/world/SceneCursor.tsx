import React, { useCallback, useEffect, useRef, useState } from "react";
import cx from "classnames";
import { useDispatch, useSelector } from "react-redux";
import {
  PlusIcon,
  ResizeIcon,
  CloseIcon,
  BrickIcon,
  PaintIcon,
} from "ui/icons/Icons";
import {
  backgroundSelectors,
  sceneSelectors,
} from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import settingsActions from "store/features/settings/settingsActions";
import entitiesActions from "store/features/entities/entitiesActions";
import {
  TOOL_COLORS,
  TOOL_COLLISIONS,
  TOOL_ERASER,
  TOOL_TRIGGERS,
  TOOL_ACTORS,
  BRUSH_FILL,
  BRUSH_MAGIC,
  BRUSH_16PX,
  TOOL_SELECT,
  COLLISION_ALL,
  TILE_PROPS,
  MIDDLE_MOUSE,
  TILE_COLOR_PROPS,
  TILE_COLOR_PALETTE,
  BRUSH_SLOPE,
} from "consts";
import clipboardActions from "store/features/clipboard/clipboardActions";
import { RootState } from "store/configureStore";
import { calculateSlope } from "shared/lib/helpers/slope";

interface SceneCursorProps {
  sceneId: string;
  sceneFiltered: boolean;
  enabled: boolean;
}

const SceneCursor = ({ sceneId, enabled, sceneFiltered }: SceneCursorProps) => {
  const dispatch = useDispatch();
  const cursorRef = useRef<HTMLDivElement>(null);
  const {
    x,
    y,
    sceneId: hoverSceneId,
  } = useSelector((state: RootState) => state.editor.hover);
  const {
    tool,
    selectedBrush,
    pasteMode,
    actorDefaults,
    triggerDefaults,
    entityId,
    selectedTileType,
    selectedPalette,
    showLayers,
  } = useSelector((state: RootState) => state.editor);

  const showCollisions = useSelector(
    (state: RootState) => state.project.present.settings.showCollisions
  );

  const [resize, setResize] = useState<boolean>(false);
  const data = useRef<{
    lockX?: boolean;
    lockY?: boolean;
    startX: number;
    startY: number;
    currentX?: number;
    currentY?: number;
    drawLine: boolean;
    drawWall: boolean;
    drawTile: number;
    isTileProp: boolean;
    isPainting: boolean;
    isDrawingSlope: boolean;
    slopeDirectionHorizontal: "left" | "right";
    slopeDirectionVertical: "left" | "right";
  }>({
    startX: 0,
    startY: 0,
    drawLine: false,
    drawWall: false,
    drawTile: 0,
    isTileProp: false,
    isPainting: false,
    isDrawingSlope: false,
    slopeDirectionHorizontal: "left",
    slopeDirectionVertical: "left",
  });
  const scene = useSelector((state: RootState) =>
    sceneSelectors.selectById(state, hoverSceneId)
  );

  const backgroundId = scene?.backgroundId ?? "";

  const background = useSelector((state: RootState) =>
    backgroundSelectors.selectById(state, backgroundId)
  );

  const hoverPalette =
    background && scene && Array.isArray(background.tileColors)
      ? background.tileColors[x + y * scene.width] || 0
      : 0;

  const hoverCollision =
    scene && Array.isArray(scene.collisions)
      ? scene.collisions[x + y * scene.width] || 0
      : 0;

  const tileLookup = useSelector((state: RootState) =>
    selectedBrush === BRUSH_MAGIC
      ? state.assets.backgrounds[background?.id ?? ""]?.lookup
      : undefined
  );

  const recalculateSlopePreview = useCallback(() => {
    if (data.current.isDrawingSlope) {
      const { endX, endY, slopeIncline } = calculateSlope(
        data.current.startX,
        data.current.startY,
        x,
        y,
        data.current.slopeDirectionHorizontal,
        data.current.slopeDirectionVertical,
        data.current.drawWall
      );
      dispatch(
        editorActions.setSlopePreview({
          sceneId,
          slopePreview: {
            startX: data.current.startX,
            startY: data.current.startY,
            endX,
            endY,
            offset: data.current.drawLine,
            slopeIncline,
          },
        })
      );
    }
  }, [dispatch, sceneId, x, y]);

  const onKeyDown = useCallback(
    (e) => {
      if (e.target.nodeName !== "BODY") {
        return;
      }
      if (e.shiftKey) {
        data.current.drawLine = true;
      }
      if (e.ctrlKey) {
        data.current.drawWall = true;
        recalculateSlopePreview();
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
    [dispatch, enabled, recalculateSlopePreview, sceneId, x, y]
  );

  const onKeyUp = useCallback(
    (e) => {
      if (e.target.nodeName !== "BODY") {
        return;
      }
      if (!e.shiftKey) {
        data.current.drawLine = false;
      }
      if (!e.ctrlKey) {
        data.current.drawWall = false;
        recalculateSlopePreview();
      }
    },
    [recalculateSlopePreview]
  );

  // Keyboard handlers
  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [onKeyDown, onKeyUp]);

  const onMouseMoveTriggers = useCallback(() => {
    if (
      entityId &&
      (data.current.currentX !== x || data.current.currentY !== y)
    ) {
      dispatch(
        entitiesActions.resizeTrigger({
          triggerId: entityId,
          startX: data.current.startX,
          startY: data.current.startY,
          x,
          y,
        })
      );
      data.current.currentX = x;
      data.current.currentY = y;
    }
  }, [dispatch, entityId, x, y]);

  const onMouseMoveCollisions = useCallback(() => {
    if (!enabled) {
      return;
    }

    if (selectedBrush === BRUSH_SLOPE) {
      data.current.isDrawingSlope = true;

      const { endX, endY, slopeIncline } = calculateSlope(
        data.current.startX,
        data.current.startY,
        x,
        y,
        data.current.slopeDirectionHorizontal,
        data.current.slopeDirectionVertical,
        data.current.drawWall
      );

      dispatch(
        editorActions.setSlopePreview({
          sceneId,
          slopePreview: {
            startX: data.current.startX,
            startY: data.current.startY,
            endX,
            endY,
            offset: data.current.drawLine,
            slopeIncline,
          },
        })
      );
    } else if (data.current.currentX !== x || data.current.currentY !== y) {
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
            isTileProp: data.current.isTileProp,
            drawLine: true,
            tileLookup,
          })
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
            isTileProp: data.current.isTileProp,
            drawLine: true,
            tileLookup,
          })
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
          })
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
          })
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

  const onMouseMoveSlopeSelect = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (cursorRef.current && data.current.isPainting) {
        const { left, top, width, height } =
          cursorRef.current.getBoundingClientRect();
        const x = e.clientX - left;
        const y = e.clientY - top;
        data.current.slopeDirectionHorizontal =
          y > height * 0.5 ? "left" : "right";
        data.current.slopeDirectionVertical =
          x <= width * 0.5 ? "left" : "right";
      }
    },
    []
  );

  const onMouseMove = useCallback(() => {
    if (sceneId !== hoverSceneId) {
      return;
    }
    if (tool === "triggers" && resize) {
      onMouseMoveTriggers();
    } else if (
      data.current.isPainting &&
      (tool === "collisions" || tool === "eraser")
    ) {
      onMouseMoveCollisions();
    } else if (data.current.isPainting && tool === "colors") {
      onMouseMoveColors();
    }
  }, [
    hoverSceneId,
    onMouseMoveCollisions,
    onMouseMoveColors,
    onMouseMoveTriggers,
    resize,
    sceneId,
    tool,
  ]);

  const onMouseUp = useCallback(() => {
    if (tool === "triggers") {
      if (sceneId !== hoverSceneId) {
        return;
      }
      dispatch(editorActions.setTool({ tool: "select" }));
      setResize(false);
    }
    if (data.current.isDrawingSlope) {
      const { endX, endY, slopeIncline } = calculateSlope(
        data.current.startX,
        data.current.startY,
        x,
        y,
        data.current.slopeDirectionHorizontal,
        data.current.slopeDirectionVertical,
        data.current.drawWall
      );

      dispatch(
        entitiesActions.paintSlopeCollision({
          sceneId,
          startX: data.current.startX,
          startY: data.current.startY,
          endX,
          endY,
          offset: data.current.drawLine,
          slopeIncline,
          slopeDirection:
            Math.sign(endX - data.current.startX) ===
            Math.sign(data.current.startY - endY)
              ? "right"
              : "left",
        })
      );
    }
    data.current.isPainting = false;
    data.current.isDrawingSlope = false;
  }, [dispatch, hoverSceneId, sceneId, tool, x, y]);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const onMouseDownActor = useCallback(() => {
    if (pasteMode) {
      dispatch(
        clipboardActions.pasteActorAt({
          sceneId,
          x,
          y,
        })
      );
    } else {
      dispatch(
        entitiesActions.addActor({
          sceneId,
          x,
          y,
          defaults: actorDefaults,
        })
      );
    }
    dispatch(editorActions.setTool({ tool: "select" }));
  }, [actorDefaults, dispatch, pasteMode, sceneId, x, y]);

  const onMouseDownTrigger = useCallback(() => {
    if (pasteMode) {
      dispatch(
        clipboardActions.pasteTriggerAt({
          sceneId,
          x,
          y,
        })
      );
    } else {
      dispatch(
        entitiesActions.addTrigger({
          sceneId,
          x,
          y,
          width: 1,
          height: 1,
          defaults: triggerDefaults,
        })
      );
    }

    data.current.startX = x;
    data.current.startY = y;
    setResize(true);
  }, [dispatch, pasteMode, sceneId, triggerDefaults, x, y]);

  const onMouseDownCollisions = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (e.altKey) {
        data.current.drawTile = hoverCollision;
        dispatch(
          editorActions.setSelectedTileType({ tileType: hoverCollision })
        );
        return;
      }
      if (!scene) {
        return;
      }
      if (
        !data.current.drawLine ||
        data.current.startX === undefined ||
        data.current.startY === undefined
      ) {
        const brushSize = selectedBrush === BRUSH_16PX ? 2 : 1;
        data.current.drawTile = 0;
        data.current.isTileProp = (selectedTileType & TILE_PROPS) !== 0;

        // If any tile under brush is currently not filled then
        // paint collisions rather than remove them
        for (let xi = x; xi < x + brushSize; xi++) {
          for (let yi = y; yi < y + brushSize; yi++) {
            const collisionIndex = scene.width * yi + xi;
            if (selectedTileType & COLLISION_ALL) {
              // If drawing collisions replace existing collision if selected is different
              if (
                (scene.collisions[collisionIndex] & COLLISION_ALL) !==
                (selectedTileType & COLLISION_ALL)
              ) {
                data.current.drawTile = selectedTileType;
              } else {
                data.current.drawTile =
                  scene.collisions[collisionIndex] & TILE_PROPS;
              }
            } else if (selectedTileType & TILE_PROPS) {
              // If drawing props replace but keep collisions
              const tileProp = selectedTileType & TILE_PROPS;
              const currentProp = scene.collisions[collisionIndex] & TILE_PROPS;
              if (currentProp !== tileProp) {
                data.current.drawTile = tileProp;
              } else {
                data.current.drawTile =
                  scene.collisions[collisionIndex] & COLLISION_ALL;
              }
            }
          }
        }
      }
      if (selectedBrush === BRUSH_FILL) {
        dispatch(
          entitiesActions.paintCollision({
            brush: selectedBrush,
            sceneId,
            x,
            y,
            value: data.current.drawTile,
            isTileProp: data.current.isTileProp,
            tileLookup,
          })
        );
      } else if (selectedBrush === BRUSH_MAGIC) {
        if (tileLookup) {
          dispatch(
            entitiesActions.paintCollision({
              brush: "magic",
              sceneId,
              tileLookup,
              x,
              y,
              value: data.current.drawTile,
              isTileProp: data.current.isTileProp,
            })
          );
        } else {
          dispatch(editorActions.selectScene({ sceneId }));
        }
      } else if (selectedBrush === BRUSH_SLOPE) {
        data.current.startX = x;
        data.current.startY = y;
        data.current.isPainting = true;
        dispatch(
          editorActions.setSlopePreview({
            sceneId,
            slopePreview: undefined,
          })
        );
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
              value: data.current.drawTile,
              isTileProp: data.current.isTileProp,
              drawLine: true,
              tileLookup,
            })
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
              value: data.current.drawTile,
              isTileProp: data.current.isTileProp,
              tileLookup,
            })
          );
        }
        data.current.isPainting = true;
      }
    },
    [
      dispatch,
      hoverCollision,
      scene,
      sceneId,
      selectedBrush,
      selectedTileType,
      tileLookup,
      x,
      y,
    ]
  );

  const onMouseDownColors = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (e.altKey) {
        dispatch(
          editorActions.setSelectedPalette({ paletteIndex: hoverPalette })
        );
        return;
      }

      data.current.isTileProp = (selectedPalette & TILE_COLOR_PROPS) !== 0;
      data.current.drawTile = 0;

      // If any tile under brush is currently not filled then
      // paint tileColors rather than remove them
      if (selectedPalette & TILE_COLOR_PROPS) {
        // If drawing props replace but keep tileColors
        const tileProp = selectedPalette & TILE_COLOR_PROPS;
        const currentProp = hoverPalette & TILE_COLOR_PROPS;
        if (currentProp !== tileProp) {
          data.current.drawTile = tileProp;
        } else {
          data.current.drawTile = hoverPalette & TILE_COLOR_PALETTE;
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
          })
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
            })
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
            })
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
            })
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
    ]
  );

  const onMouseDownEraser = useCallback(() => {
    if (showCollisions) {
      data.current.drawTile = 0;
      data.current.isTileProp = false;
      if (selectedBrush === BRUSH_FILL) {
        dispatch(
          entitiesActions.paintCollision({
            brush: selectedBrush,
            sceneId,
            x,
            y,
            value: data.current.drawTile,
            isTileProp: data.current.isTileProp,
            tileLookup,
          })
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
              isTileProp: data.current.isTileProp,
            })
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
              isTileProp: data.current.isTileProp,
              drawLine: true,
              tileLookup,
            })
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
              isTileProp: data.current.isTileProp,
              tileLookup,
            })
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
          entitiesActions.removeActorAt({ sceneId, x: x + 1, y: y + 1 })
        );
        dispatch(
          entitiesActions.removeTriggerAt({ sceneId, x: x + 1, y: y + 1 })
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

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!scene) {
        return;
      }
      if (e.nativeEvent.which === MIDDLE_MOUSE) {
        return;
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

      if (tool === "actors") {
        onMouseDownActor();
      } else if (tool === "triggers") {
        onMouseDownTrigger();
      } else if (tool === "collisions") {
        if (e.nativeEvent.which === 3) {
          // right mouse always erase
          onMouseDownEraser();
        } else {
          onMouseDownCollisions(e);
        }
      } else if (tool === "colors") {
        onMouseDownColors(e);
      } else if (tool === "eraser") {
        onMouseDownEraser();
      } else if (tool === "select") {
        dispatch(editorActions.selectScene({ sceneId }));
      }
    },
    [
      dispatch,
      onMouseDownActor,
      onMouseDownCollisions,
      onMouseDownColors,
      onMouseDownEraser,
      onMouseDownTrigger,
      scene,
      sceneFiltered,
      sceneId,
      tool,
    ]
  );

  if (!enabled) {
    return <div />;
  }
  return (
    <div
      ref={cursorRef}
      className={cx("SceneCursor", {
        "SceneCursor--AddActor": tool === TOOL_ACTORS,
        "SceneCursor--AddTrigger": tool === TOOL_TRIGGERS,
        "SceneCursor--Eraser": tool === TOOL_ERASER,
        "SceneCursor--Collisions": tool === TOOL_COLLISIONS,
        "SceneCursor--Colors": tool === TOOL_COLORS,
        "SceneCursor--Size16px":
          (tool === TOOL_COLORS ||
            tool === TOOL_COLLISIONS ||
            tool === TOOL_ERASER) &&
          selectedBrush === BRUSH_16PX,
      })}
      onMouseMove={onMouseMoveSlopeSelect}
      onMouseDown={onMouseDown}
      style={{
        top: y * 8,
        left: x * 8,
      }}
    >
      {(tool === TOOL_ACTORS ||
        tool === TOOL_TRIGGERS ||
        tool === TOOL_ERASER ||
        tool === TOOL_COLORS ||
        tool === TOOL_COLLISIONS) && (
        <div className="SceneCursor__AddBubble">
          {tool === TOOL_ACTORS && <PlusIcon />}
          {tool === TOOL_TRIGGERS && (resize ? <ResizeIcon /> : <PlusIcon />)}
          {tool === TOOL_ERASER && <CloseIcon />}
          {tool === TOOL_COLLISIONS && <BrickIcon />}
          {tool === TOOL_COLORS && <PaintIcon />}
        </div>
      )}
    </div>
  );
};

export default SceneCursor;
