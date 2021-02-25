import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled, { css } from "styled-components";
import { RootState } from "../../store/configureStore";
import {
  metaspriteSelectors,
  metaspriteTileSelectors,
  spriteAnimationSelectors,
  spriteSheetSelectors,
} from "../../store/features/entities/entitiesState";
import { MetaspriteTile } from "../../store/features/entities/entitiesTypes";
import MetaspriteGrid from "./MetaspriteGrid";
import { SpriteSliceCanvas } from "./preview/SpriteSliceCanvas";
import entitiesActions from "../../store/features/entities/entitiesActions";
import editorActions from "../../store/features/editor/editorActions";
import clipboardActions from "../../store/features/clipboard/clipboardActions";
import { PayloadAction } from "@reduxjs/toolkit";
import { MetaspriteCanvas } from "./preview/MetaspriteCanvas";

interface MetaspriteEditorProps {
  spriteSheetId: string;
  metaspriteId: string;
  animationId: string;
  hidden?: boolean;
}

export interface MetaspriteDraggableTileProps {
  selected?: boolean;
}

interface ScrollWrapperProps {
  hidden?: boolean;
}

const ScrollWrapper = styled.div<ScrollWrapperProps>`
  overflow-y: scroll;
  overflow-x: auto;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  ${(props) =>
    props.hidden
      ? css`
          display: none;
        `
      : ""}
`;

const ContentWrapper = styled.div`
  display: flex;
  height: 100%;
  justify-content: center;
  align-items: center;
  overflow: hidden;
`;

const DocumentWrapper = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
`;

const GridWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const MetaspriteDraggableTile = styled.div<MetaspriteDraggableTileProps>`
  position: absolute;
  width: 8px;
  height: 16px;

  :hover::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    box-shadow: 0px 0px 0px 1px rgba(255, 0, 0, 0.2) inset;
    z-index: 100;
    width: 8px;
    height: 16px;
  }

  ${(props) =>
    props.selected
      ? css`
          &&::after {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            box-shadow: 0px 0px 0px 1px rgba(255, 0, 0, 0.5) inset;
            z-index: 10;
            width: 8px;
            height: 16px;
          }
        `
      : ""}
`;

const SpriteBoundingBox = styled.div`
  position: absolute;
  background: rgba(255, 193, 7, 0.58);
  box-shadow: 0px 0px 0px 1px rgba(255, 0, 0, 0.2) inset;
`;

const StampTilesWrapper = styled.div`
  position: absolute;
  opacity: 0.5;
  pointer-events: none;
  box-shadow: 0px 0px 0px 1px rgba(255, 0, 0, 0.5) inset;
  canvas {
    display: block;
  }
`;

const Selection = styled.div`
  position: absolute;
  background: rgba(128, 128, 128, 0.02);
  border: 1px solid rgba(128, 128, 128, 0.3);
`;

interface Position {
  x: number;
  y: number;
}

interface MetaspriteSelection {
  id: string;
  origin: Position;
}

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const MetaspriteEditor = ({
  spriteSheetId,
  metaspriteId,
  animationId,
  hidden,
}: MetaspriteEditorProps) => {
  const dispatch = useDispatch();
  const gridRef = useRef<HTMLDivElement>(null);
  const gridSize = 8;
  const zoom = useSelector((state: RootState) => state.editor.zoomSprite) / 100;
  const showSpriteGrid = useSelector(
    (state: RootState) => state.editor.showSpriteGrid
  );
  const spriteSheet = useSelector((state: RootState) =>
    spriteSheetSelectors.selectById(state, spriteSheetId)
  );
  const metasprite = useSelector((state: RootState) =>
    metaspriteSelectors.selectById(state, metaspriteId)
  );
  const metaspriteTileLookup = useSelector((state: RootState) =>
    metaspriteTileSelectors.selectEntities(state)
  );
  const newTiles = useSelector(
    (state: RootState) => state.editor.spriteTileSelection
  );
  const metaspriteTiles =
    metasprite?.tiles
      .map((tileId) => metaspriteTileLookup[tileId] as MetaspriteTile)
      .filter((i) => i) || [];
  const selectedTileIds = useSelector(
    (state: RootState) => state.editor.selectedMetaspriteTileIds
  );
  const showOnionSkin = useSelector(
    (state: RootState) => state.editor.showOnionSkin
  );
  const showBoundingBox = useSelector(
    (state: RootState) => state.editor.showSpriteBoundingBox
  );
  const spriteAnimation = useSelector((state: RootState) =>
    spriteAnimationSelectors.selectById(state, animationId)
  );
  const [selectionOrigin, setSelectionOrigin] = useState<
    Position | undefined
  >();
  const [selectionRect, setSelectionRect] = useState<
    SelectionRect | undefined
  >();
  const [draggingSelection, setDraggingSelection] = useState(false);
  const [draggingMetasprite, setDraggingMetasprite] = useState(false);
  const dragMetasprites = useRef<MetaspriteSelection[]>([]);
  const [dragOrigin, setDragOrigin] = useState<Position>({ x: 0, y: 0 });
  const [createOrigin, setCreateOrigin] = useState<Position>({ x: 0, y: 0 });
  const [isOverEditor, setIsOverEditor] = useState(false);
  const frames = spriteAnimation?.frames || [];
  const currentIndex = frames.indexOf(metaspriteId);
  const prevMetaspriteId =
    frames[(frames.length + (currentIndex - 1)) % frames.length] || "";
  const canvasWidth = spriteSheet?.canvasWidth || 0;
  const canvasHeight = spriteSheet?.canvasHeight || 0;
  const boundsWidth = spriteSheet?.boundsWidth || 16;
  const boundsHeight = spriteSheet?.boundsHeight || 16;
  const boundsX = spriteSheet?.boundsX || 0;
  const boundsY = spriteSheet?.boundsY || 0;

  const onMoveCreateCursor = useCallback(
    (e: MouseEvent) => {
      if (gridRef.current && newTiles) {
        const bounds = gridRef.current.getBoundingClientRect();
        setCreateOrigin({
          x: Math.floor(
            ((e.pageX - bounds.left) / bounds.width) * canvasWidth -
              canvasWidth / 2 +
              8 -
              newTiles.width * 4
          ),
          y: Math.floor(
            canvasHeight -
              16 -
              ((e.pageY - bounds.top) / bounds.height) * canvasHeight +
              newTiles.height * 8
          ),
        });
      }
    },
    [
      setCreateOrigin,
      gridRef.current,
      newTiles?.width,
      newTiles?.height,
      canvasWidth,
      canvasHeight,
    ]
  );

  const onCreateTiles = useCallback(
    (e: MouseEvent) => {
      if (!newTiles) {
        return;
      }

      e.preventDefault();

      // Clear focus from animation timeline
      const el = document.querySelector(":focus") as any;
      if (el && el.blur) el.blur();

      const newActions: PayloadAction<{
        metaspriteTileId: string;
        metaspriteId: string;
        x: number;
        y: number;
        sliceX: number;
        sliceY: number;
      }>[] = [];

      for (let tx = 0; tx < newTiles.width; tx++) {
        for (let ty = 0; ty < newTiles.height; ty++) {
          newActions.push(
            entitiesActions.addMetaspriteTile({
              metaspriteId,
              x: createOrigin.x + tx * 8,
              y: createOrigin.y - ty * 16,
              sliceX: newTiles.x + tx * 8,
              sliceY: newTiles.y + ty * 16,
            })
          );
        }
      }

      for (const action of newActions) {
        dispatch(action);
      }

      const newIds = newActions.map(
        (action) => action.payload.metaspriteTileId
      );

      setSelectedTileIds(newIds);
      removeMetaspriteTilesOutsideCanvas();
    },
    [createOrigin.x, createOrigin.y, newTiles?.x, newTiles?.y]
  );

  const onDragStart = (tileId: string) => (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    const tile = metaspriteTileLookup[tileId];
    if (tile) {
      e.stopPropagation();

      // Clear focus from animation timeline
      const el = document.querySelector(":focus") as any;
      if (el && el.blur) el.blur();

      if (e.shiftKey) {
        toggleSelectedTileId(tileId);
      } else {
        let ids = selectedTileIds;
        if (!selectedTileIds.includes(tileId)) {
          setSelectedTileId(tileId);
          ids = [tileId];
        }
        // Store starting positions
        dragMetasprites.current = ids.map((id) => {
          return {
            id,
            origin: {
              x: metaspriteTileLookup[id]?.x || 0,
              y: metaspriteTileLookup[id]?.y || 0,
            },
          };
        });
        setDragOrigin({ x: e.pageX, y: e.pageY });
        setDraggingMetasprite(true);
      }
    }
  };

  const onDrag = useCallback(
    (e: MouseEvent) => {
      dispatch(
        entitiesActions.moveMetaspriteTiles(
          dragMetasprites.current.map((selection) => ({
            metaspriteTileId: selection.id,
            x: Math.round(selection.origin.x + (e.pageX - dragOrigin.x) / zoom),
            y: Math.round(selection.origin.y - (e.pageY - dragOrigin.y) / zoom),
          }))
        )
      );
    },
    [dragMetasprites.current, dragOrigin.x, dragOrigin.y, zoom]
  );

  const onDragEnd = (e: MouseEvent) => {
    setDraggingMetasprite(false);
    removeMetaspriteTilesOutsideCanvas();
  };

  const onSelectStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (gridRef.current && !newTiles) {
        const bounds = gridRef.current.getBoundingClientRect();
        const x = e.pageX - bounds.left;
        const y = e.pageY - bounds.top;
        setSelectionRect(undefined);
        setSelectionOrigin({
          x,
          y,
        });
        setDraggingSelection(true);
      }
    },
    [newTiles]
  );

  const onDragSelection = useCallback(
    (e: MouseEvent) => {
      if (gridRef.current && selectionOrigin) {
        const bounds = gridRef.current.getBoundingClientRect();
        const x2 = e.pageX - bounds.left;
        const y2 = e.pageY - bounds.top;

        const x = Math.min(selectionOrigin.x, x2);
        const y = Math.min(selectionOrigin.y, y2);
        const width = Math.abs(selectionOrigin.x - x2);
        const height = Math.abs(selectionOrigin.y - y2);

        const canvasX1 = x / zoom - (canvasWidth / 2 - 8);
        const canvasY1 = canvasHeight - 16 - y / zoom;
        const canvasX2 = (x + width) / zoom - (canvasWidth / 2 - 8);
        const canvasY2 = canvasHeight - 16 - (y + height) / zoom;

        const intersectingTiles = metaspriteTiles.filter(
          (tile) =>
            tile.x + 8 > canvasX1 &&
            tile.x < canvasX2 &&
            tile.y - 16 < canvasY1 &&
            tile.y > canvasY2
        );
        const intersectingTileIds = intersectingTiles.map((tile) => tile.id);

        setSelectionRect({
          x,
          y,
          width,
          height,
        });
        setSelectedTileIds(intersectingTileIds);
      }
    },
    [selectionOrigin?.x, selectionOrigin?.y, zoom]
  );

  const onDragSelectionEnd = (e: MouseEvent) => {
    setDraggingSelection(false);
    setSelectionRect(undefined);
  };

  const onDeselect = () => {
    resetSelectedTileIds();
  };

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.target as any).nodeName !== "BODY") {
        return;
      }
      if (e.ctrlKey || e.metaKey) {
        return;
      }
      if (selectedTileIds.length === 0) {
        if (e.key === "Escape") {
          resetSpriteTileSelection();
          resetSelectedTileIds();
        }
        return;
      }
      e.preventDefault();

      let nudgeX = 0;
      let nudgeY = 0;
      if (e.key === "ArrowUp") {
        nudgeY = 1;
      } else if (e.key === "ArrowDown") {
        nudgeY = -1;
      } else if (e.key === "ArrowLeft") {
        nudgeX = -1;
      } else if (e.key === "ArrowRight") {
        nudgeX = 1;
      }

      if (e.shiftKey) {
        nudgeX *= 8;
        nudgeY *= 8;
      }

      if (nudgeX !== 0 || nudgeY !== 0) {
        nudgeSelectedTiles(nudgeX, nudgeY);
      }

      if (e.key === "Escape") {
        resetSpriteTileSelection();
        resetSelectedTileIds();
      }

      if (e.key === "x") {
        flipXSelectedTiles();
      }
      if (e.key === "z") {
        flipYSelectedTiles();
      }
      if (e.key === "Backspace") {
        removeSelectedTiles();
      }
    },
    [selectedTileIds]
  );

  const nudgeSelectedTiles = useCallback(
    (x: number, y: number) => {
      dispatch(
        entitiesActions.moveMetaspriteTilesRelative({
          metaspriteTileIds: selectedTileIds,
          x: Math.round(x),
          y: Math.round(y),
        })
      );
    },
    [dispatch, selectedTileIds, selectedTileIds.length]
  );

  const flipXSelectedTiles = useCallback(() => {
    dispatch(
      entitiesActions.flipXMetaspriteTiles({
        metaspriteTileIds: selectedTileIds,
      })
    );
  }, [dispatch, selectedTileIds]);

  const flipYSelectedTiles = useCallback(() => {
    dispatch(
      entitiesActions.flipYMetaspriteTiles({
        metaspriteTileIds: selectedTileIds,
      })
    );
  }, [dispatch, selectedTileIds]);

  const removeSelectedTiles = useCallback(() => {
    dispatch(
      entitiesActions.removeMetaspriteTiles({
        metaspriteTileIds: selectedTileIds,
        metaspriteId,
      })
    );
  }, [dispatch, selectedTileIds, metaspriteId]);

  const setSelectedTileId = useCallback((tileId: string) => {
    dispatch(editorActions.setSelectedMetaspriteTileId(tileId));
  }, []);

  const setSelectedTileIds = useCallback((tileIds: string[]) => {
    dispatch(editorActions.setSelectedMetaspriteTileIds(tileIds));
  }, []);

  const toggleSelectedTileId = useCallback((tileId: string) => {
    dispatch(editorActions.toggleSelectedMetaspriteTileId(tileId));
  }, []);

  const resetSelectedTileIds = useCallback(() => {
    dispatch(editorActions.resetSelectedMetaspriteTileIds());
  }, []);

  const resetSpriteTileSelection = useCallback(() => {
    dispatch(editorActions.resetSpriteTileSelection());
  }, []);

  const removeMetaspriteTilesOutsideCanvas = useCallback(() => {
    dispatch(
      entitiesActions.removeMetaspriteTilesOutsideCanvas({
        metaspriteId,
        spriteSheetId,
      })
    );
  }, [metaspriteId, spriteSheetId]);

  const onCopyTiles = useCallback(() => {
    dispatch(
      clipboardActions.copyMetaspriteTiles({
        metaspriteTileIds: selectedTileIds,
      })
    );
  }, [selectedTileIds]);

  const onCopyMetasprite = useCallback(() => {
    dispatch(
      clipboardActions.copyMetasprites({
        metaspriteIds: [metaspriteId],
      })
    );
  }, [metaspriteId]);

  const onCopy = useCallback(() => {
    if (selectedTileIds.length > 0) {
      onCopyTiles();
    } else {
      onCopyMetasprite();
    }
  }, [selectedTileIds]);

  const onPaste = useCallback(() => {
    dispatch(
      clipboardActions.pasteSprite({
        metaspriteId,
        spriteAnimationId: animationId,
      })
    );
  }, [metaspriteId, animationId]);

  const onOverEditor = useCallback(() => {
    setIsOverEditor(true);
  }, [setIsOverEditor]);

  const onLeaveEditor = useCallback(() => {
    setIsOverEditor(false);
  }, [setIsOverEditor]);

  const onSelectAll = useCallback(
    (e) => {
      const selection = window.getSelection();
      if (!selection || selection.focusNode) {
        return;
      }
      window.getSelection()?.empty();
      setSelectedTileIds(metasprite?.tiles || []);
    },
    [metasprite?.tiles]
  );

  // Keyboard handlers
  useEffect(() => {
    if (!hidden) {
      window.addEventListener("keydown", onKeyDown);
      return () => {
        window.removeEventListener("keydown", onKeyDown);
      };
    }
    return () => {};
  }, [onKeyDown, hidden]);

  // Drag and drop handlers
  useEffect(() => {
    if (draggingMetasprite && !hidden) {
      window.addEventListener("mousemove", onDrag);
      window.addEventListener("mouseup", onDragEnd);
      return () => {
        window.removeEventListener("mousemove", onDrag);
        window.removeEventListener("mouseup", onDragEnd);
      };
    }
    return () => {};
  }, [draggingMetasprite, onDrag, hidden]);

  useEffect(() => {
    if (draggingSelection && !hidden) {
      window.addEventListener("mousemove", onDragSelection);
      window.addEventListener("mouseup", onDragSelectionEnd);
      return () => {
        window.removeEventListener("mousemove", onDragSelection);
        window.removeEventListener("mouseup", onDragSelectionEnd);
      };
    }
    return () => {};
  }, [draggingSelection, onDragSelection, hidden]);

  useEffect(() => {
    if (newTiles && isOverEditor && !hidden) {
      window.addEventListener("mousemove", onMoveCreateCursor);
      window.addEventListener("mousedown", onCreateTiles);
      return () => {
        window.removeEventListener("mousemove", onMoveCreateCursor);
        window.removeEventListener("mousedown", onCreateTiles);
      };
    }
    return () => {};
  }, [newTiles, isOverEditor, hidden, onMoveCreateCursor, onCreateTiles]);

  // Clipboard
  useEffect(() => {
    if (!hidden) {
      window.addEventListener("copy", onCopy);
      window.addEventListener("paste", onPaste);
      return () => {
        window.removeEventListener("copy", onCopy);
        window.removeEventListener("paste", onPaste);
      };
    }
    return () => {};
  }, [hidden, selectedTileIds, metaspriteId, animationId]);

  // Selection
  useEffect(() => {
    if (!hidden) {
      document.addEventListener("selectionchange", onSelectAll);
      return () => {
        document.removeEventListener("selectionchange", onSelectAll);
      };
    }
    return () => {};
  }, [hidden, metasprite?.tiles]);

  if (!metasprite) {
    return null;
  }

  return (
    <ScrollWrapper hidden={hidden}>
      <ContentWrapper
        style={{
          minWidth: canvasWidth * zoom + 100,
          minHeight: canvasHeight * zoom + 110,
        }}
        onMouseDown={onSelectStart}
      >
        <DocumentWrapper onMouseDown={!newTiles ? onDeselect : undefined} />
        <GridWrapper
          ref={gridRef}
          onMouseEnter={onOverEditor}
          onMouseLeave={onLeaveEditor}
        >
          <MetaspriteGrid
            width={canvasWidth}
            height={canvasHeight}
            zoom={zoom}
            showGrid={showSpriteGrid}
            gridSize={gridSize}
            onClick={onDeselect}
          >
            {showOnionSkin && prevMetaspriteId && (
              <div
                style={{
                  opacity: 0.5,
                  position: "absolute",
                  left: 8 - canvasWidth / 2,
                  top: -canvasHeight,
                  pointerEvents: "none",
                }}
              >
                <MetaspriteCanvas
                  spriteSheetId={spriteSheetId}
                  metaspriteId={prevMetaspriteId}
                />
              </div>
            )}
            {metaspriteTiles.map((metaspriteTile) => (
              <MetaspriteDraggableTile
                key={metaspriteTile.id}
                style={{
                  left: metaspriteTile.x,
                  top: -metaspriteTile.y - 16,
                  pointerEvents: newTiles ? "none" : "auto",
                }}
                selected={selectedTileIds.includes(metaspriteTile.id)}
                onMouseDown={onDragStart(metaspriteTile.id)}
              >
                <SpriteSliceCanvas
                  spriteSheetId={spriteSheetId}
                  offsetX={metaspriteTile.sliceX}
                  offsetY={metaspriteTile.sliceY}
                  width={8}
                  height={16}
                  flipX={metaspriteTile.flipX}
                  flipY={metaspriteTile.flipY}
                  objPalette={metaspriteTile.objPalette}
                />
              </MetaspriteDraggableTile>
            ))}
            {isOverEditor && newTiles && (
              <StampTilesWrapper
                style={{
                  left: createOrigin.x,
                  top: -createOrigin.y - 16,
                }}
              >
                <SpriteSliceCanvas
                  spriteSheetId={spriteSheetId}
                  offsetX={newTiles.x}
                  offsetY={newTiles.y}
                  width={newTiles.width * 8}
                  height={newTiles.height * 16}
                  flipX={false}
                  flipY={false}
                  objPalette="OBP0"
                />
              </StampTilesWrapper>
            )}
            {showBoundingBox && (
              <SpriteBoundingBox
                style={{
                  left: boundsX,
                  top: -boundsY - boundsHeight,
                  width: boundsWidth,
                  height: boundsHeight,
                }}
              />
            )}
          </MetaspriteGrid>
          {selectionRect && (
            <Selection
              style={{
                left: selectionRect.x,
                top: selectionRect.y,
                width: selectionRect.width,
                height: selectionRect.height,
              }}
            />
          )}
        </GridWrapper>
      </ContentWrapper>
    </ScrollWrapper>
  );
};

export default MetaspriteEditor;
