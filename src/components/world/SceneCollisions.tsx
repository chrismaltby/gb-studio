import React, { useEffect, useRef } from "react";
import {
  COLLISION_TOP,
  COLLISION_ALL,
  COLLISION_BOTTOM,
  COLLISION_LEFT,
  COLLISION_RIGHT,
  TILE_PROP_LADDER,
} from "../../consts";

const TILE_SIZE = 8;

interface SceneCollisionsProps {
  width: number;
  height: number;
  collisions: number[];
}

const SceneCollisions = ({
  width,
  height,
  collisions,
}: SceneCollisionsProps) => {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvas.current) {
      // eslint-disable-next-line no-self-assign
      canvas.current.width = canvas.current.width; // Clear canvas
      const ctx = canvas.current.getContext("2d");

      if (!ctx) return;

      for (let yi = 0; yi < height; yi++) {
        for (let xi = 0; xi < width; xi++) {
          const collisionIndex = width * yi + xi;
          const tile = collisions[collisionIndex];
          if ((tile & COLLISION_ALL) === COLLISION_ALL) {
            ctx.fillStyle = "rgba(250,40,40,0.6)";
            ctx.fillRect(xi * TILE_SIZE, yi * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          } else if (tile !== 0) {
            if (tile & COLLISION_TOP) {
              ctx.fillStyle = "rgba(40,40,250,0.6)";
              ctx.fillRect(
                xi * TILE_SIZE,
                yi * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE * 0.4
              );
            }
            if (tile & COLLISION_BOTTOM) {
              ctx.fillStyle = "rgba(255,250,40,0.6)";
              ctx.fillRect(
                xi * TILE_SIZE,
                (yi + 0.6) * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE * 0.4
              );
            }
            if (tile & COLLISION_LEFT) {
              ctx.fillStyle = "rgba(250,40,250,0.6)";
              ctx.fillRect(
                xi * TILE_SIZE,
                yi * TILE_SIZE,
                TILE_SIZE * 0.4,
                TILE_SIZE
              );
            }
            if (tile & COLLISION_RIGHT) {
              ctx.fillStyle = "rgba(40,250,250,0.6)";
              ctx.fillRect(
                (xi + 0.6) * TILE_SIZE,
                yi * TILE_SIZE,
                TILE_SIZE * 0.4,
                TILE_SIZE
              );
            }
          }
          if (tile & TILE_PROP_LADDER) {
            ctx.fillStyle = "rgba(0,128,0,0.6)";
            ctx.fillRect(
              (xi + 0.0) * TILE_SIZE,
              yi * TILE_SIZE,
              TILE_SIZE * 0.2,
              TILE_SIZE
            );
            ctx.fillRect(
              (xi + 0.8) * TILE_SIZE,
              yi * TILE_SIZE,
              TILE_SIZE * 0.2,
              TILE_SIZE
            );
            ctx.fillRect(
              xi * TILE_SIZE,
              (yi + 0.4) * TILE_SIZE,
              TILE_SIZE,
              TILE_SIZE * 0.2
            );
          }
        }
      }
    }
  }, [collisions, height, width]);

  return (
    <canvas
      ref={canvas}
      width={width * TILE_SIZE}
      height={height * TILE_SIZE}
    />
  );
};

export default SceneCollisions;
