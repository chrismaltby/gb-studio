import React, { useCallback, useEffect, useRef, useState } from "react";
import { SlopePreview } from "store/features/editor/editorState";
import styled from "styled-components";

const TILE_SIZE = 8;

const Canvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
`;

interface SceneSlopePreviewProps {
  width: number;
  height: number;
  slopePreview: SlopePreview;
}

const SceneSlopePreview = ({
  width,
  height,
  slopePreview,
}: SceneSlopePreviewProps) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { startX, startY, endX, endY, slopeIncline } = slopePreview;
  const [offset, setOffset] = useState(slopePreview.offset);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (!(e.target instanceof HTMLElement)) return;
    if (e.target.nodeName !== "BODY") {
      return;
    }
    if (e.shiftKey) {
      setOffset(true);
    }
  }, []);

  const onKeyUp = useCallback((e: KeyboardEvent) => {
    if (!(e.target instanceof HTMLElement)) return;
    if (e.target.nodeName !== "BODY") {
      return;
    }
    if (!e.shiftKey) {
      setOffset(false);
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

  useEffect(() => {
    if (canvas.current) {
      // eslint-disable-next-line no-self-assign
      canvas.current.width = canvas.current.width; // Clear canvas
      const ctx = canvas.current.getContext("2d");

      if (!ctx) return;

      ctx.strokeStyle = "rgba(0,0,255,0.6)";

      let lineStartX = 0;
      let lineStartY = 0;
      let lineEndX = 0;
      let lineEndY = 0;

      const diffX = endX - startX;
      const diffY = endY - startY;
      const signX = Math.sign(diffX);
      const signY = Math.sign(diffY);

      if (endX < startX) {
        lineStartX = (startX + 1) * TILE_SIZE;
        lineEndX = (endX + 1) * TILE_SIZE;
      } else {
        lineStartX = startX * TILE_SIZE;
        lineEndX = endX * TILE_SIZE;
      }

      if (endY < startY) {
        lineStartY = (startY + 1) * TILE_SIZE;
        lineEndY = (endY + 1) * TILE_SIZE;
      } else {
        lineStartY = startY * TILE_SIZE;
        lineEndY = endY * TILE_SIZE;
      }

      if (slopeIncline === "shallow" && offset) {
        lineStartY += signY * 0.5 * TILE_SIZE;
        lineEndY += signY * 0.5 * TILE_SIZE;
      }
      if (slopeIncline === "steep" && offset) {
        lineStartX += signX * 0.5 * TILE_SIZE;
        lineEndX += signX * 0.5 * TILE_SIZE;
      }

      if (
        lineStartY === lineEndY &&
        // Drag left to right for top collision
        // Drag right to left for bottom collision
        // Shift to toggle
        ((lineStartX > lineEndX && !offset) ||
          (lineStartX <= lineEndX && offset))
      ) {
        // Bottom collision
        ctx.strokeStyle = "rgba(255,250,40,0.6)";
        lineStartY += TILE_SIZE - 1;
        lineEndY += TILE_SIZE - 1;
      }
      if (
        lineStartX === lineEndX &&
        // Drag top to bottom for left collision
        // Drag bottom to top for right collision
        // Shift to toggle
        ((lineStartY > lineEndY && !offset) ||
          (lineStartY <= lineEndY && offset))
      ) {
        // Right collision
        ctx.strokeStyle = "rgba(40,250,250,0.6)";
        lineStartX += TILE_SIZE - 1;
        lineEndX += TILE_SIZE - 1;
      } else if (lineStartX === lineEndX) {
        // Left collision
        ctx.strokeStyle = "rgba(250,40,250,0.6)";
      }

      ctx.moveTo(lineStartX, lineStartY);
      ctx.lineTo(lineEndX, lineEndY);
      ctx.stroke();
    }
  }, [endX, endY, height, offset, slopeIncline, startX, startY, width]);

  return (
    <Canvas
      ref={canvas}
      width={width * TILE_SIZE}
      height={height * TILE_SIZE}
    />
  );
};

export default SceneSlopePreview;
