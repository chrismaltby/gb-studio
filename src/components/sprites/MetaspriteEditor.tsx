import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled, { css } from "styled-components";
import { RootState } from "../../store/configureStore";
import {
  metaspriteSelectors,
  metaspriteTileSelectors,
} from "../../store/features/entities/entitiesState";
import { MetaspriteTile } from "../../store/features/entities/entitiesTypes";
import MetaspriteGrid from "./preview/MetaspriteGrid";
import { SpriteSliceCanvas } from "./preview/SpriteSliceCanvas";
import entitiesActions from "../../store/features/entities/entitiesActions";
import editorActions from "../../store/features/editor/editorActions";

interface MetaspriteEditorProps {
  spriteSheetId: string;
  metaspriteId: string;
}

export interface MetaspriteDraggableTileProps {
  selected?: boolean;
}

const MetaspriteDraggableTile = styled.div<MetaspriteDraggableTileProps>`
  position: absolute;
  width: 8px;
  height: 16px;

  :hover::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    box-shadow: 0px 0px 0px 1px rgba(255, 0, 0, 0.2);
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
            box-shadow: 0px 0px 0px 1px rgba(255, 0, 0, 0.5);
            z-index: 10;
            width: 8px;
            height: 16px;
          }
        `
      : ""}
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
}: MetaspriteEditorProps) => {
  const dispatch = useDispatch();
  const gridRef = useRef<HTMLDivElement>(null);
  const canvasWidth = 32;
  const canvasHeight = 40;
  const gridSize = 8;
  const zoom = useSelector((state: RootState) => state.editor.zoomSprite) / 100;
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
  const [draggingMetasprite, setDraggingMetasprite] = useState(false);
  const dragMetasprites = useRef<MetaspriteSelection[]>([]);
  const [dragOrigin, setDragOrigin] = useState<Position>({ x: 0, y: 0 });
  const [createOrigin, setCreateOrigin] = useState<Position>({ x: 0, y: 0 });
  const [isOverEditor, setIsOverEditor] = useState(false);

  const onMoveCreateCursor = useCallback(
    (e: MouseEvent) => {
      if (gridRef.current && newTiles) {
        const bounds = gridRef.current.getBoundingClientRect();
        console.log({
          x: Math.floor(((e.pageX - bounds.left) / bounds.width) * canvasWidth),
          y: Math.floor(
            ((e.pageY - bounds.top) / bounds.height) * canvasHeight
          ),
        });

        setCreateOrigin({
          x: Math.floor(
            ((e.pageX - bounds.left) / bounds.width) * canvasWidth -
              newTiles.width * 4
          ),
          y: Math.floor(
            ((e.pageY - bounds.top) / bounds.height) * canvasHeight -
              newTiles.height * 8
          ),
        });
      }
    },
    [setCreateOrigin, gridRef.current, newTiles?.width, newTiles?.height]
  );

  const onCreateTiles = useCallback(() => {
    console.log("CREATE");
  }, []);

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
            y: Math.round(selection.origin.y + (e.pageY - dragOrigin.y) / zoom),
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
        return;
      }
      e.preventDefault();

      let nudgeX = 0;
      let nudgeY = 0;
      if (e.key === "ArrowUp") {
        nudgeY = -1;
      } else if (e.key === "ArrowDown") {
        nudgeY = 1;
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

  const toggleSelectedTileId = useCallback((tileId: string) => {
    dispatch(editorActions.toggleSelectedMetaspriteTileId(tileId));
  }, []);

  const resetSelectedTileIds = useCallback(() => {
    dispatch(editorActions.resetSelectedMetaspriteTileIds());
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
    if (newTiles) {
      window.addEventListener("mousemove", onMoveCreateCursor);
      window.addEventListener("mouseup", onCreateTiles);
      return () => {
        window.removeEventListener("mousemove", onMoveCreateCursor);
        window.removeEventListener("mouseup", onCreateTiles);
      };
    }
    return () => {};
  }, [newTiles, onMoveCreateCursor, onCreateTiles]);

  return (
    <>
      <div
        style={{
          overflow: "auto",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        onMouseEnter={onOverEditor}
        onMouseLeave={onLeaveEditor}
      >
        <div
          style={{
            display: "flex",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
            minWidth: canvasWidth * zoom + 100,
            minHeight: canvasHeight * zoom + 110,
          }}
        >
          <div
            onMouseDown={onDeselect}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            }}
          />
          <div ref={gridRef} style={{ display: "inline-block" }}>
            <MetaspriteGrid
              width={canvasWidth}
              height={canvasHeight}
              zoom={zoom}
              gridSize={gridSize}
              onClick={onDeselect}
            >
              {metaspriteTiles.map((metaspriteTile) => (
                <MetaspriteDraggableTile
                  key={metaspriteTile.id}
                  style={{
                    left: metaspriteTile.x,
                    top: metaspriteTile.y,
                  }}
                  selected={selectedTileIds.includes(metaspriteTile.id)}
                  onMouseDown={onDragStart(metaspriteTile.id)}
                >
                  <SpriteSliceCanvas
                    spriteSheetId={spriteSheetId}
                    offsetX={metaspriteTile.sliceX * 8}
                    offsetY={metaspriteTile.sliceY * 8}
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
                    top: createOrigin.y,
                    opacity: 0.5,
                  }}
                >
                  <SpriteSliceCanvas
                    spriteSheetId={spriteSheetId}
                    offsetX={newTiles.x * 8}
                    offsetY={newTiles.y * 8}
                    width={newTiles.width * 8}
                    height={newTiles.height * 16}
                    flipX={false}
                    flipY={false}
                  />
                </div>
              )}
            </MetaspriteGrid>
          </div>
        </div>
      </div>
      {/* {newTiles && (
        <div
          ref={createRef}
          style={{
            overflow: "hidden",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: createOrigin.x,
              top: createOrigin.y,
              transform: `translate3d(0, 0, 0) scale(${zoom})`,
              transformOrigin: "top left",
            }}
          >
            <SpriteSliceCanvas
              spriteSheetId={spriteSheetId}
              offsetX={newTiles.x * 8}
              offsetY={newTiles.y * 8}
              width={newTiles.width * 8}
              height={newTiles.height * 16}
              flipX={false}
              flipY={false}
            />
          </div>
        </div>
      )} */}
    </>
  );
};

export default MetaspriteEditor;
