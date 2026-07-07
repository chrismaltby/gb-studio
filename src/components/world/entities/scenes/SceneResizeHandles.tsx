import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { MAX_SCENE_TILE_COUNT, TILE_SIZE } from "consts";
import { useAppDispatch } from "store/hooks";
import entitiesActions from "store/features/entities/entitiesActions";

export type ResizeEdge = "top" | "right" | "bottom" | "left";

export interface ResizeGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  shiftX: number;
  shiftY: number;
}

export interface ResizeStart extends ResizeGeometry {
  edge: ResizeEdge;
  pageX: number;
  pageY: number;
  preview: ResizeGeometry;
}

const HANDLE_SIZE = 5;
const MIN_WIDTH = 20;
const MIN_HEIGHT = 18;
const MAX_SIZE = 255;

const Handle = styled.div<{ $edge: ResizeEdge }>`
  position: absolute;
  z-index: 300;
  background: ${(props) => props.theme.colors.highlight};
  opacity: 0;

  ${(props) =>
    props.$edge === "left" || props.$edge === "right"
      ? `
        top: 0;
        bottom: 0;
        width: ${HANDLE_SIZE}px;
        ${props.$edge}: -${HANDLE_SIZE}px;
        cursor: ew-resize;
      `
      : `
        left: 0;
        right: 0;
        height: ${HANDLE_SIZE}px;
        ${props.$edge}: -${HANDLE_SIZE}px;
        cursor: ns-resize;
      `}

  &:hover {
    opacity: 0.5;
    outline: 2px solid ${(props) => props.theme.colors.highlight};
  }
`;

const Preview = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  z-index: 250;
  pointer-events: none;
  box-sizing: border-box;
  border: 2px solid ${(props) => props.theme.colors.highlight};

  span {
    position: relative;
    border-radius: 40px;
    padding: 5px 10px;
    background: ${(props) => props.theme.colors.highlight};
    color: ${(props) => props.theme.colors.highlightText};
  }

  &:before {
    content: "";
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    background: ${(props) => props.theme.colors.highlight};
    opacity: 0.3;
  }
`;

export const resizeGeometry = (
  start: ResizeStart,
  pageX: number,
  pageY: number,
  zoomRatio: number,
): ResizeGeometry => {
  const deltaX = Math.round((pageX - start.pageX) / zoomRatio / TILE_SIZE);
  const deltaY = Math.round((pageY - start.pageY) / zoomRatio / TILE_SIZE);
  let nextX = start.x;
  let nextY = start.y;
  let nextWidth = start.width;
  let nextHeight = start.height;
  let shiftX = 0;
  let shiftY = 0;

  if (start.edge === "left" || start.edge === "right") {
    const maxWidth = Math.min(
      MAX_SIZE,
      Math.floor(MAX_SCENE_TILE_COUNT / start.height),
    );
    nextWidth = Math.max(
      MIN_WIDTH,
      Math.min(
        maxWidth,
        start.width + (start.edge === "left" ? -deltaX : deltaX),
      ),
    );
    if (start.edge === "left") {
      const delta = start.width - nextWidth;
      nextX = start.x + delta * TILE_SIZE;
      shiftX = -delta;
    }
  } else {
    const maxHeight = Math.min(
      MAX_SIZE,
      Math.floor(MAX_SCENE_TILE_COUNT / start.width),
    );
    nextHeight = Math.max(
      MIN_HEIGHT,
      Math.min(
        maxHeight,
        start.height + (start.edge === "top" ? -deltaY : deltaY),
      ),
    );
    if (start.edge === "top") {
      const delta = start.height - nextHeight;
      nextY = start.y + delta * TILE_SIZE;
      shiftY = -delta;
    }
  }

  return {
    x: nextX,
    y: nextY,
    width: nextWidth,
    height: nextHeight,
    shiftX,
    shiftY,
  };
};

interface SceneResizeHandlesProps {
  sceneId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zoomRatio: number;
}

const SceneResizeHandles = ({
  sceneId,
  x,
  y,
  width,
  height,
  zoomRatio,
}: SceneResizeHandlesProps) => {
  const dispatch = useAppDispatch();
  const drag = useRef<ResizeStart | undefined>(undefined);
  const [preview, setPreview] = useState<ResizeGeometry>();

  const commitResize = useCallback(() => {
    const next = drag.current?.preview;
    if (!next) {
      return;
    }
    if (
      next.x !== x ||
      next.y !== y ||
      next.width !== width ||
      next.height !== height
    ) {
      dispatch(
        entitiesActions.resizeTilemapLayers({
          sceneId,
          ...next,
          resizeAxis:
            drag.current?.edge === "left" || drag.current?.edge === "right"
              ? "width"
              : "height",
        }),
      );
    }
  }, [dispatch, height, sceneId, width, x, y]);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (drag.current) {
        const next = resizeGeometry(drag.current, e.pageX, e.pageY, zoomRatio);
        drag.current.preview = next;
        setPreview(next);
      }
    },
    [zoomRatio],
  );

  const onMouseUp = useCallback(() => {
    if (drag.current) {
      commitResize();
    }
    drag.current = undefined;
    setPreview(undefined);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }, [commitResize, onMouseMove]);

  useEffect(
    () => () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    },
    [onMouseMove, onMouseUp],
  );

  const onMouseDown = useCallback(
    (edge: ResizeEdge) => (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.preventDefault();
      e.stopPropagation();
      drag.current = {
        edge,
        pageX: e.pageX,
        pageY: e.pageY,
        x,
        y,
        width,
        height,
        shiftX: 0,
        shiftY: 0,
        preview: { x, y, width, height, shiftX: 0, shiftY: 0 },
      };
      setPreview(drag.current.preview);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [height, onMouseMove, onMouseUp, width, x, y],
  );

  return (
    <>
      {preview && (
        <Preview
          style={{
            left: preview.x - x,
            top: preview.y - y,
            width: preview.width * TILE_SIZE,
            height: preview.height * TILE_SIZE,
          }}
        >
          <span>
            {preview.width} x {preview.height}
          </span>
        </Preview>
      )}
      {(["top", "right", "bottom", "left"] as ResizeEdge[]).map((edge) => (
        <Handle
          key={edge}
          data-testid={`scene-resize-${edge}`}
          $edge={edge}
          onMouseDown={onMouseDown(edge)}
        />
      ))}
    </>
  );
};

export default SceneResizeHandles;
