import React, { useEffect, useRef } from "react";
import { TILE_COLOR_PROP_PRIORITY } from "../../consts";

const TILE_SIZE = 8;

interface ScenePriorityMapProps {
  width: number;
  height: number;
  tileColors: number[];
}

const ScenePriorityMap = ({
  width,
  height,
  tileColors,
}: ScenePriorityMapProps) => {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvas.current) {
      // eslint-disable-next-line no-self-assign
      canvas.current.width = canvas.current.width; // Clear canvas
      const ctx = canvas.current.getContext("2d");

      if (!ctx) return;

      for (let yi = 0; yi < height; yi++) {
        for (let xi = 0; xi < width; xi++) {
          const tileIndex = width * yi + xi;
          const tile = tileColors[tileIndex];
          if ((tile & TILE_COLOR_PROP_PRIORITY) === TILE_COLOR_PROP_PRIORITY) {
            ctx.fillStyle = "rgba(40,250,40,0.3)";
          } else {
            ctx.fillStyle = "rgba(40,40,40,0.6)";
          }
          ctx.fillRect(xi * TILE_SIZE, yi * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }, [tileColors, height, width]);

  return (
    <canvas
      ref={canvas}
      width={width * TILE_SIZE}
      height={height * TILE_SIZE}
    />
  );
};

export default ScenePriorityMap;
