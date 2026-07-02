import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { TILE_SIZE } from "consts";

const Canvas = styled.canvas`
  position: absolute;
  inset: 0;
  pointer-events: none;
  image-rendering: pixelated;
`;

interface TilesetUnsetDefaultsOverlayProps {
  width: number;
  height: number;
  values: number[];
  unsetValue: number;
}

const TilesetUnsetDefaultsOverlay = ({
  width,
  height,
  values,
  unsetValue,
}: TilesetUnsetDefaultsOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width * TILE_SIZE, height * TILE_SIZE);
    ctx.fillStyle = "rgba(128, 128, 128, 0.8)";
    for (let index = 0; index < width * height; index++) {
      if ((values[index] ?? unsetValue) !== unsetValue) continue;
      const x = (index % width) * TILE_SIZE;
      const y = Math.floor(index / width) * TILE_SIZE;
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    }
  }, [height, unsetValue, values, width]);

  return (
    <Canvas
      ref={canvasRef}
      width={width * TILE_SIZE}
      height={height * TILE_SIZE}
    />
  );
};

export default TilesetUnsetDefaultsOverlay;
