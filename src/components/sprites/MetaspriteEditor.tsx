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
import { PayloadAction } from "@reduxjs/toolkit";
import { MetaspriteCanvas } from "./preview/MetaspriteCanvas";

interface MetaspriteEditorProps {
  spriteSheetId: string;
  metaspriteId: string;
  animationId: string;
}

export interface MetaspriteDraggableTileProps {
  selected?: boolean;
}

const ScrollWrapper = styled.div`
  overflow-y: scroll;
  overflow-x: auto;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

const ContentWrapper = styled.div`
  display: flex;
  height: 100%;
  justify-content: center;
  align-items: center;
`;

const DocumentWrapper = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
`;

const GridWrapper = styled.div`
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

interface Position {
  x: number;
  y: number;
}

interface MetaspriteSelection {
  id: string;
  origin: Position;
}

const MetaspriteEditor = ({
  spriteSheetId,
  metaspriteId,
  animationId,
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
            -8 +
              ((e.pageX - bounds.left) / bounds.width) * canvasWidth -
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
    [setCreateOrigin, gridRef.current, newTiles?.width, newTiles?.height]
  );

  const onCreateTiles = useCallback(
    (e: MouseEvent) => {
      if (!newTiles) {
        return;
      }

      e.preventDefault();

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
    },
    [createOrigin.x, createOrigin.y, newTiles?.x, newTiles?.y]
  );

  const onDragStart = (tileId: string) => (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    const tile = metaspriteTileLookup[tileId];
    if (tile) {
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
      dragMetasprites.current.forEach((selection) => {
        dispatch(
          entitiesActions.moveMetaspriteTile({
            metaspriteTileId: selection.id,
            x: Math.round(selection.origin.x + (e.pageX - dragOrigin.x) / zoom),
            y: Math.round(selection.origin.y - (e.pageY - dragOrigin.y) / zoom),
          })
        );
      });
    },
    [dragMetasprites.current, dragOrigin.x, dragOrigin.y, zoom]
  );

  const onDragEnd = (e: MouseEvent) => {
    setDraggingMetasprite(false);
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
        resetSelectedTileIds();
      }

      if (e.key === "x") {
        flipXSelectedTiles(!metaspriteTileLookup[selectedTileIds[0]]?.flipX);
      }
      if (e.key === "z") {
        flipYSelectedTiles(!metaspriteTileLookup[selectedTileIds[0]]?.flipY);
      }
      if (e.key === "Backspace") {
        removeSelectedTiles();
      }
    },
    [
      selectedTileIds,
      metaspriteTileLookup[selectedTileIds[0]]?.flipX,
      metaspriteTileLookup[selectedTileIds[0]]?.flipY,
    ]
  );

  const nudgeSelectedTiles = useCallback(
    (x: number, y: number) => {
      selectedTileIds.forEach((id) => {
        dispatch(
          entitiesActions.moveMetaspriteTileRelative({
            metaspriteTileId: id,
            x: Math.round(x),
            y: Math.round(y),
          })
        );
      });
    },
    [dispatch, selectedTileIds]
  );

  const flipXSelectedTiles = useCallback(
    (flipX: boolean) => {
      selectedTileIds.forEach((id) => {
        dispatch(
          entitiesActions.editMetaspriteTile({
            metaspriteTileId: id,
            changes: {
              flipX,
            },
          })
        );
      });
    },
    [dispatch, selectedTileIds]
  );

  const flipYSelectedTiles = useCallback(
    (flipY: boolean) => {
      selectedTileIds.forEach((id) => {
        dispatch(
          entitiesActions.editMetaspriteTile({
            metaspriteTileId: id,
            changes: {
              flipY,
            },
          })
        );
      });
    },
    [dispatch, selectedTileIds]
  );

  const removeSelectedTiles = useCallback(() => {
    selectedTileIds.forEach((id) => {
      dispatch(
        entitiesActions.removeMetaspriteTile({
          metaspriteTileId: id,
        })
      );
    });
  }, [dispatch, selectedTileIds]);

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

  const onOverEditor = useCallback(() => {
    setIsOverEditor(true);
  }, [setIsOverEditor]);

  const onLeaveEditor = useCallback(() => {
    setIsOverEditor(false);
  }, [setIsOverEditor]);

  // Keyboard handlers
  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);

  // Drag and drop handlers
  useEffect(() => {
    if (draggingMetasprite) {
      window.addEventListener("mousemove", onDrag);
      window.addEventListener("mouseup", onDragEnd);
      return () => {
        window.removeEventListener("mousemove", onDrag);
        window.removeEventListener("mouseup", onDragEnd);
      };
    }
    return () => {};
  }, [draggingMetasprite, onDrag]);

  useEffect(() => {
    if (newTiles && isOverEditor) {
      window.addEventListener("mousemove", onMoveCreateCursor);
      window.addEventListener("mouseup", onCreateTiles);
      return () => {
        window.removeEventListener("mousemove", onMoveCreateCursor);
        window.removeEventListener("mouseup", onCreateTiles);
      };
    }
    return () => {};
  }, [newTiles, isOverEditor, onMoveCreateCursor, onCreateTiles]);

  return (
    <ScrollWrapper>
      <ContentWrapper
        style={{
          minWidth: canvasWidth * zoom + 100,
          minHeight: canvasHeight * zoom + 110,
        }}
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
                />
              </MetaspriteDraggableTile>
            ))}
            {isOverEditor && newTiles && (
              <div
                style={{
                  position: "absolute",
                  left: createOrigin.x,
                  top: -createOrigin.y - 16,
                  opacity: 0.5,
                  pointerEvents: "none",
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
                />
              </div>
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
        </GridWrapper>
      </ContentWrapper>
    </ScrollWrapper>
  );
};

export default MetaspriteEditor;
