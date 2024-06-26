import React, { useEffect, useRef } from "react";
import {
  COLLISION_TOP,
  COLLISION_ALL,
  COLLISION_BOTTOM,
  COLLISION_LEFT,
  COLLISION_RIGHT,
  TILE_PROP_LADDER,
  TILE_PROPS,
  COLLISION_SLOPE_45_RIGHT,
  COLLISION_SLOPE_22_RIGHT_BOT,
  COLLISION_SLOPE_22_RIGHT_TOP,
  COLLISION_SLOPE_45_LEFT,
  COLLISION_SLOPE_22_LEFT_TOP,
  COLLISION_SLOPE_22_LEFT_BOT,
} from "consts";

const TILE_SIZE = 8;
const EXTRA_SYMBOLS = "89ABCDEF";

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

      ctx.font = "8px Public Pixel";

      for (let yi = 0; yi < height; yi++) {
        for (let xi = 0; xi < width; xi++) {
          const collisionIndex = width * yi + xi;
          const tile = collisions[collisionIndex];
          const tileprop = tile & TILE_PROPS;
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
          if (tileprop) {
            switch (tileprop) {
              case TILE_PROP_LADDER: // Ladder
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
                break;
              case COLLISION_SLOPE_45_RIGHT: // slope right
                ctx.strokeStyle = "rgba(0,0,255,0.6)";
                ctx.beginPath();
                ctx.moveTo((xi + 0) * TILE_SIZE, (yi + 1) * TILE_SIZE);
                ctx.lineTo((xi + 1) * TILE_SIZE, (yi + 0) * TILE_SIZE);
                ctx.stroke(); // Render the path
                break;
              case COLLISION_SLOPE_22_RIGHT_BOT: // slope right shalow BOT
                ctx.strokeStyle = "rgba(0,0,255,0.6)";
                ctx.beginPath();
                ctx.moveTo((xi + 0) * TILE_SIZE, (yi + 1) * TILE_SIZE);
                ctx.lineTo((xi + 1) * TILE_SIZE, (yi + 0.5) * TILE_SIZE);
                ctx.stroke(); // Render the path
                break;
              case COLLISION_SLOPE_22_RIGHT_TOP: // slope right shalow TOP
                ctx.strokeStyle = "rgba(0,0,255,0.6)";
                ctx.beginPath();
                ctx.moveTo((xi + 0) * TILE_SIZE, (yi + 0.5) * TILE_SIZE);
                ctx.lineTo((xi + 1) * TILE_SIZE, (yi + 0) * TILE_SIZE);
                ctx.stroke(); // Render the path
                break;
              case COLLISION_SLOPE_45_LEFT: // slope left
                ctx.strokeStyle = "rgba(0,0,255,0.6)";
                ctx.beginPath();
                ctx.moveTo((xi + 0) * TILE_SIZE, (yi + 0) * TILE_SIZE);
                ctx.lineTo((xi + 1) * TILE_SIZE, (yi + 1) * TILE_SIZE);
                ctx.stroke(); // Render the path
                break;
              case COLLISION_SLOPE_22_LEFT_BOT: // slope left shalow BOT
                ctx.strokeStyle = "rgba(0,0,255,0.6)";
                ctx.beginPath();
                ctx.moveTo((xi + 1) * TILE_SIZE, (yi + 1) * TILE_SIZE);
                ctx.lineTo((xi + 0) * TILE_SIZE, (yi + 0.5) * TILE_SIZE);
                ctx.stroke(); // Render the path
                break;
              case COLLISION_SLOPE_22_LEFT_TOP: // slope left shalow TOP
                ctx.strokeStyle = "rgba(0,0,255,0.6)";
                ctx.beginPath();
                ctx.moveTo((xi + 1) * TILE_SIZE, (yi + 0.5) * TILE_SIZE);
                ctx.lineTo((xi + 0) * TILE_SIZE, (yi + 0) * TILE_SIZE);
                ctx.stroke(); // Render the path
                break;
              default:
                const tileprop_value = (tileprop >> 4) - 7;
                switch (tileprop_value) {
                  case 1:
                  case 2:
                    ctx.fillStyle = `rgba(0,128,0,0.5)`;
                    break;
                  case 3:
                  case 4:
                    ctx.fillStyle = `rgba(128,0,0,0.5)`;
                    break;
                  case 5:
                  case 6:
                    ctx.fillStyle = `rgba(0,0,128,0.5)`;
                    break;
                  case 7:
                  case 8:
                    ctx.fillStyle = `rgba(128,0,128,0.5)`;
                    break;
                }
                ctx.fillRect(xi * TILE_SIZE, yi * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = "rgba(255,255,255,0.9)";
                ctx.fillText(
                  EXTRA_SYMBOLS[tileprop_value - 1],
                  xi * TILE_SIZE,
                  (yi + 0.9) * TILE_SIZE
                );
                break;
            }
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
