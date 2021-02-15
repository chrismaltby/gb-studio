import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import styled, { css } from "styled-components";
import { RootState } from "../../store/configureStore";
import { MetaspriteTile } from "../../store/features/entities/entitiesTypes";
import MetaspriteGrid from "./preview/MetaspriteGrid";
import { SpriteSliceCanvas } from "./preview/SpriteSliceCanvas";

interface MetaspriteEditorProps {
  id: string;
}

const dummyMetasprite: MetaspriteTile[] = [
  {
    id: "1",
    x: 8,
    y: 24,
    sliceX: 1,
    sliceY: 2,
    palette: 0,
    flipX: true,
    flipY: false,
  },

  {
    id: "2",
    x: 16,
    y: 24,
    sliceX: 2,
    sliceY: 2,
    palette: 0,
    flipX: false,
    flipY: false,
  },
  {
    id: "3",
    x: 8,
    y: 12,
    sliceX: 1,
    sliceY: 15,
    palette: 0,
    flipX: false,
    flipY: false,
  },
  {
    id: "4",
    x: 16,
    y: 12,
    sliceX: 2,
    sliceY: 15,
    palette: 0,
    flipX: false,
    flipY: false,
  },
];

export interface MetaspriteDraggableTileProps {
  selected?: boolean;
}

const MetaspriteDraggableTile = styled.div<MetaspriteDraggableTileProps>`
  position: absolute;
  width: 8px;
  height: 16px;

  :hover {
    box-shadow: 0px 0px 0px 1px rgba(255, 0, 0, 0.2);
    z-index: 100;
  }

  ${(props) =>
    props.selected
      ? css`
          && {
            box-shadow: 0px 0px 0px 1px rgba(255, 0, 0, 0.5);
            z-index: 10;
          }
        `
      : ""}
`;

const MetaspriteEditor = ({ id }: MetaspriteEditorProps) => {
  const canvasWidth = 32;
  const canvasHeight = 40;
  const gridSize = 8;
  const zoom = useSelector((state: RootState) => state.editor.zoomSprite) / 100;
  const [metasprite, setMetasprite] = useState(dummyMetasprite);
  const [selectedMetasprite, setSelectedMetasprite] = useState(0);
  const [draggingMetasprite, setDraggingMetasprite] = useState(false);
  const [metaspriteOrigin, setMetaspriteOrigin] = useState({ x: 0, y: 0 });
  const [dragOrigin, setDragOrigin] = useState({ x: 0, y: 0 });

  const onDragStart = (index: number) => (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    setSelectedMetasprite(index);
    setMetaspriteOrigin({ x: metasprite[index].x, y: metasprite[index].y });
    setDragOrigin({ x: e.pageX, y: e.pageY });
    setDraggingMetasprite(true);
  };

  const onDrag = useCallback(
    (e: MouseEvent) => {
      const newMetasprite = metasprite.map((m, index) => {
        if (index === selectedMetasprite) {
          return {
            ...m,
            x: metaspriteOrigin.x + (e.pageX - dragOrigin.x) / zoom,
            y: metaspriteOrigin.y + (e.pageY - dragOrigin.y) / zoom,
          };
        }
        return m;
      });
      setMetasprite(newMetasprite);
    },
    [
      metasprite,
      selectedMetasprite,
      metaspriteOrigin.x,
      metaspriteOrigin.y,
      dragOrigin.x,
      dragOrigin.y,
      zoom,
    ]
  );

  const onDragEnd = (e: MouseEvent) => {
    setDraggingMetasprite(false);
  };

  const onDeselect = () => {
    setSelectedMetasprite(-1);
  };

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
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
        setMetasprite((ms) => {
          return ms.map((m, index) => {
            if (index === selectedMetasprite) {
              return {
                ...m,
                x: m.x + nudgeX,
                y: m.y + nudgeY,
              };
            }
            return m;
          });
        });
      }

      if (e.key === "Escape") {
        setSelectedMetasprite(-1);
      }

      if (e.key === "x") {
        setMetasprite((ms) => {
          return ms.map((m, index) => {
            if (index === selectedMetasprite) {
              return {
                ...m,
                flipX: !m.flipX,
              };
            }
            return m;
          });
        });
      }
      if (e.key === "z") {
        setMetasprite((ms) => {
          return ms.map((m, index) => {
            if (index === selectedMetasprite) {
              return {
                ...m,
                flipY: !m.flipY,
              };
            }
            return m;
          });
        });
      }
      if (e.key === "Backspace") {
        const deleteMetasprite = selectedMetasprite;
        setMetasprite((ms) => {
          return ms.filter((m, index) => {
            return index !== deleteMetasprite;
          });
        });
        setSelectedMetasprite(-1);
      }
    },
    [selectedMetasprite]
  );

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

  return (
    <div
      style={{
        overflow: "scroll",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
          minWidth: canvasWidth * zoom + 100,
          minHeight: canvasHeight * zoom + 10,
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
        <MetaspriteGrid
          width={canvasWidth}
          height={canvasHeight}
          zoom={zoom}
          gridSize={gridSize}
          onClick={onDeselect}
        >
          {metasprite.map((metaspriteTile, metaspriteIndex) => (
            <MetaspriteDraggableTile
              key={metaspriteTile.id}
              style={{
                left: metaspriteTile.x,
                top: metaspriteTile.y,
              }}
              selected={metaspriteIndex === selectedMetasprite}
              onMouseDown={onDragStart(metaspriteIndex)}
            >
              <SpriteSliceCanvas
                spriteSheetId={id}
                offsetX={metaspriteTile.sliceX * 8}
                offsetY={metaspriteTile.sliceY * 8}
                width={8}
                height={16}
                flipX={metaspriteTile.flipX}
                flipY={metaspriteTile.flipY}
              />
            </MetaspriteDraggableTile>
          ))}
        </MetaspriteGrid>
      </div>
    </div>
  );
};

export default MetaspriteEditor;
