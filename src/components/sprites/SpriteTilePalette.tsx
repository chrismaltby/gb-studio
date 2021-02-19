import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { assetFilename } from "../../lib/helpers/gbstudio";
import { RootState } from "../../store/configureStore";
import { SpriteTileSelection } from "../../store/features/editor/editorState";
import { spriteSheetSelectors } from "../../store/features/entities/entitiesState";
import editorActions from "../../store/features/editor/editorActions";

interface SpriteTilePaletteProps {
  id: string;
}

interface HoverTile {
  x: number;
  y: number;
}

const SpriteTilePalette = ({ id }: SpriteTilePaletteProps) => {
  const dispatch = useDispatch();
  const zoom = useSelector((state: RootState) => state.editor.zoomSpriteTiles) / 100;
  const selectedTiles = useSelector(
    (state: RootState) => state.editor.spriteTileSelection
  );

  const setSelectedTiles = useCallback(
    (tiles: SpriteTileSelection) => {
      dispatch(editorActions.setSpriteTileSelection(tiles));
    },
    [dispatch]
  );

  const [hoverTile, setHoverTile] = useState<HoverTile | undefined>();
  const [isDragging, setIsDragging] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const spriteSheet = useSelector((state: RootState) =>
    spriteSheetSelectors.selectById(state, id)
  );
  const projectRoot = useSelector((state: RootState) => state.document.root);
  const width = spriteSheet?.width || 0;
  const height = spriteSheet?.height || 0;

  const onDragStart = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    const currentTargetRect = e.currentTarget.getBoundingClientRect();
    const offsetX =
      Math.floor((e.pageX - currentTargetRect.left) / 8 / zoom) * 8;
    const offsetY = Math.min(
      height - 16,
      Math.floor((e.pageY - currentTargetRect.top) / 8 / zoom) * 8
    );

    setSelectedTiles({
      x: offsetX,
      y: offsetY,
      width: 1,
      height: 1,
    });
    setIsDragging(true);
  };

  const onDrag = useCallback(
    (e: MouseEvent) => {
      if (!wrapperRef.current || !selectedTiles) {
        return;
      }
      const currentTargetRect = wrapperRef.current.getBoundingClientRect();
      const offsetX = Math.max(
        0,
        Math.min(
          width / 8 - 1,
          Math.floor((e.pageX - currentTargetRect.left) / 8 / zoom)
        )
      );
      const offsetY = Math.max(
        0,
        Math.min(
          height / 8 - 2,
          Math.floor((e.pageY - currentTargetRect.top) / 8 / zoom)
        )
      );

      const x = Math.min(selectedTiles.x / 8, offsetX) * 8;
      const y = Math.min(selectedTiles.y / 8, offsetY) * 8;
      const selectionWidth = Math.max(
        1,
        offsetX < selectedTiles.x / 8 ? 1 : offsetX - selectedTiles.x / 8 + 1
      );
      const selectionHeight = Math.ceil(
        Math.max(
          1,
          offsetY < selectedTiles.y / 8 ? 2 : offsetY - selectedTiles.y / 8 + 1
        ) / 2
      );
      setSelectedTiles({
        x,
        y,
        width: selectionWidth,
        height: selectionHeight,
      });
    },
    [zoom, height, selectedTiles, setSelectedTiles]
  );

  const onDragEnd = (e: MouseEvent) => {
    setIsDragging(false);
    setHoverTile(undefined);
  };

  const onHover = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const currentTargetRect = e.currentTarget.getBoundingClientRect();
    const offsetX = Math.max(
      0,
      Math.min(
        width / 8 - 1,
        Math.floor((e.pageX - currentTargetRect.left) / 8 / zoom)
      )
    );
    const offsetY = Math.max(
      0,
      Math.min(
        height / 8 - 2,
        Math.floor((e.pageY - currentTargetRect.top) / 8 / zoom)
      )
    );
    setHoverTile({
      x: offsetX,
      y: offsetY,
    });
  };

  const onMouseOut = () => {
    setHoverTile(undefined);
  };

  // Drag and drop handlers
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", onDrag);
      window.addEventListener("mouseup", onDragEnd);
      return () => {
        window.removeEventListener("mousemove", onDrag);
        window.removeEventListener("mouseup", onDragEnd);
      };
    }
    return () => {};
  }, [isDragging, onDrag]);

  if (!spriteSheet) {
    return null;
  }

  const filename = `file://${assetFilename(
    projectRoot,
    "sprites",
    spriteSheet
  )}?_v=${spriteSheet._v}`;

  return (
    <div
      style={{
        position: "absolute",
        top: 32,
        left: 0,
        right: 0,
        bottom: 0,
        overflowX: "auto",
        overflowY: "scroll",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          minHeight: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            textAlign: "center",
            padding: 10,
          }}
        >
          <div
            ref={wrapperRef}
            style={{
              position: "relative",
              userSelect: "none",
              display: "inline-block",
            }}
            onMouseDown={onDragStart}
            onMouseMove={onHover}
            onMouseLeave={onMouseOut}
          >
            <img
              style={{
                imageRendering: "pixelated",
                minWidth: width * zoom,
              }}
              alt={spriteSheet.name}
              src={filename}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: width * zoom,
                height: height * zoom,
                border: `${1 / zoom}px solid #d4d4d4`,
                backgroundSize: `${8 * zoom}px ${8 * zoom}px`,
                backgroundImage:
                  zoom >= 8
                    ? `linear-gradient(to right, 
          #079f1c 1px, transparent 1px, transparent 7px, #efefef 8px, transparent 8px, transparent 15px, #efefef 16px, transparent 16px, transparent 23px, #efefef 24px, transparent 24px, transparent 31px, #efefef 32px, transparent 32px, transparent 39px, #efefef 40px, transparent 40px, transparent 47px, #efefef 48px, transparent 48px, transparent 55px, #efefef 56px, transparent 56px
          ), linear-gradient(to bottom, 
          #079f1c 1px, transparent 1px, transparent 7px, #efefef 8px, transparent 8px, transparent 15px, #efefef 16px, transparent 16px, transparent 23px, #efefef 24px, transparent 24px, transparent 31px, #efefef 32px, transparent 32px, transparent 39px, #efefef 40px, transparent 40px, transparent 47px, #efefef 48px, transparent 48px, transparent 55px, #efefef 56px, transparent 56px
          )`
                    : "linear-gradient(to right, rgba(0,220,0,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,220,0,0.5) 1px, transparent 1px)",
              }}
            />
            {hoverTile && !isDragging && (
              <div
                style={{
                  position: "absolute",
                  left: hoverTile.x * 8 * zoom,
                  top: hoverTile.y * 8 * zoom,
                  width: 8 * zoom,
                  height: 16 * zoom,
                  background: "rgba(0,0,0,0.1)",
                }}
              />
            )}
            {selectedTiles && (
              <div
                style={{
                  position: "absolute",
                  left: selectedTiles.x * zoom,
                  top: selectedTiles.y * zoom,
                  width: selectedTiles.width * 8 * zoom,
                  height: selectedTiles.height * 16 * zoom,
                  boxShadow: `0px 0px 0px ${zoom}px rgba(255, 0, 0, 0.5)`,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpriteTilePalette;
