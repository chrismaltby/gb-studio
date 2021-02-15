import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { assetFilename } from "../../../lib/helpers/gbstudio";
import { RootState } from "../../../store/configureStore";
import { spriteSheetSelectors } from "../../../store/features/entities/entitiesState";
import { FormSectionTitle } from "../../ui/form/FormLayout";

interface SpriteTilePaletteProps {
  id: string;
}

interface SelectedTiles {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface HoverTile {
  x: number;
  y: number;
}

const SpriteTilePalette = ({ id }: SpriteTilePaletteProps) => {
  const zoom = useSelector((state: RootState) => state.editor.zoomSprite) / 100;
  const [selectedTiles, setSelectedTiles] = useState<SelectedTiles | undefined>(
    {
      x: 1,
      y: 2,
      width: 2,
      height: 1,
    }
  );
  const [hoverTile, setHoverTile] = useState<HoverTile | undefined>({
    x: 1,
    y: 2,
  });
  const [isDragging, setIsDragging] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const spriteSheet = useSelector((state: RootState) =>
    spriteSheetSelectors.selectById(state, id)
  );
  const projectRoot = useSelector((state: RootState) => state.document.root);

  const onDragStart = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    const currentTargetRect = e.currentTarget.getBoundingClientRect();
    const offsetX = Math.floor((e.pageX - currentTargetRect.left) / 8 / zoom);
    const offsetY = Math.floor((e.pageY - currentTargetRect.top) / 8 / zoom);
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
      if (!wrapperRef.current) {
        return;
      }
      const currentTargetRect = wrapperRef.current.getBoundingClientRect();
      const offsetX = Math.floor((e.pageX - currentTargetRect.left) / 8 / zoom);
      const offsetY = Math.floor((e.pageY - currentTargetRect.top) / 8 / zoom);
      setSelectedTiles((selected) => {
        if (!selected) return undefined;
        const x = Math.min(selected.x, offsetX);
        const y = Math.min(selected.y, offsetY);
        console.log("offsetX", offsetX, "selected.x", selected.x, "x", x);
        const width = Math.max(
          1,
          offsetX < selected.x ? 1 : offsetX - selected.x + 1
        );
        const height = Math.ceil(
          Math.max(1, offsetY < selected.y ? 2 : offsetY - selected.y + 1) / 2
        );
        return (
          selected && {
            x,
            y,
            width,
            height,
          }
        );
      });
    },
    [zoom]
  );

  const onDragEnd = (e: MouseEvent) => {
    setIsDragging(false);
    setHoverTile(undefined);
  };

  const onHover = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const currentTargetRect = e.currentTarget.getBoundingClientRect();
    const offsetX = Math.floor((e.pageX - currentTargetRect.left) / 8 / zoom);
    const offsetY = Math.floor((e.pageY - currentTargetRect.top) / 8 / zoom);
    if (offsetX < 0 || offsetY < 0 || offsetX > 10 || offsetY > 18) {
      setHoverTile(undefined);
    } else {
      setHoverTile({
        x: offsetX,
        y: offsetY,
      });
    }
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
    <>
      <FormSectionTitle>Tiles</FormSectionTitle>
      <div
        style={{
          position: "absolute",
          top: 32,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "scroll",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <div
            ref={wrapperRef}
            style={{
              position: "relative",
              userSelect: "none",
            }}
            onMouseDown={onDragStart}
            onMouseMove={onHover}
            onMouseLeave={onMouseOut}
          >
            <img
              style={{
                imageRendering: "pixelated",
                minWidth: 88 * zoom,
              }}
              alt={spriteSheet.name}
              src={filename}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 88 * zoom,
                height: 200 * zoom,
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
                  left: selectedTiles.x * 8 * zoom,
                  top: selectedTiles.y * 8 * zoom,
                  width: selectedTiles.width * 8 * zoom,
                  height: selectedTiles.height * 16 * zoom,
                  boxShadow: `0px 0px 0px ${zoom}px rgba(255, 0, 0, 0.5)`,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SpriteTilePalette;
