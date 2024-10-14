import React, { useEffect, useMemo, useRef } from "react";
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
  COLLISIONS_EXTRA_SYMBOLS,
} from "consts";
import { useAppSelector } from "store/hooks";

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

  const collisionAlpha = useAppSelector(
    (state) => Math.floor(state.project.present.settings.collisionLayerAlpha) / 255
  );

  const collisionSettings = useAppSelector(
    (state) => state.project.present.settings.collisionSettings
  );

  const solidColor = useMemo(
    () => {
      const setting = collisionSettings.find(s => s.key == "solid");
      return setting ? setting.color : "#FA2828FF";
    }, 
    [collisionSettings, collisionAlpha]
  );

  const topColor = useMemo(
    () => {
      const setting = collisionSettings.find(s => s.key == "top");
      return setting ? setting.color : "#2828FAFF";
    }, 
    [collisionSettings, collisionAlpha]
  );

  const bottomColor = useMemo(
    () => {
      const setting = collisionSettings.find(s => s.key == "bottom");
      return setting ? setting.color : "#FFFA28FF";
    }, 
    [collisionSettings, collisionAlpha]
  );

  const leftColor = useMemo(
    () => {
      const setting = collisionSettings.find(s => s.key == "left");
      return setting ? setting.color : "#FA28FAFF";
    }, 
    [collisionSettings, collisionAlpha]
  );

  const rightColor = useMemo(
    () => {
      const setting = collisionSettings.find(s => s.key == "right");
      return setting ? setting.color : "#28FAFAFF";
    }, 
    [collisionSettings, collisionAlpha]
  );

  const ladderColor = useMemo(
    () => {
      const setting = collisionSettings.find(s => s.key == "ladder");
      return setting ? setting.color : "#008000FF";
    },
    [collisionSettings, collisionAlpha]
  );

  const slopeColor = "#0000FFFF";
  const slope45RightColor = useMemo(
    () => {
      const setting = collisionSettings.find(s => s.key == "slope_45_right");
      return setting ? setting.color : slopeColor;
    },
    [collisionSettings, collisionAlpha]
  );

  const slope45LeftColor = useMemo(
    () => {
      const setting = collisionSettings.find(s => s.key == "slope_45_left");
      return setting ? setting.color : slopeColor;
    },
    [collisionSettings, collisionAlpha]
  );

  const slope22RightBotColor = useMemo(
    () => {
      const setting = collisionSettings.find(s => s.key == "slope_22_right_bot");
      return setting ? setting.color : slopeColor;
    },
    [collisionSettings, collisionAlpha]
  );

  const slope22RightTopColor = useMemo(
    () => {
      const setting = collisionSettings.find(s => s.key == "slope_22_right_top");
      return setting ? setting.color : slopeColor;
    },
    [collisionSettings, collisionAlpha]
  );

  const slope22LeftTopColor = useMemo(
    () => {
      const setting = collisionSettings.find(s => s.key == "slope_22_left_top");
      return setting ? setting.color : slopeColor;
    },
    [collisionSettings, collisionAlpha]
  );

  const slope22LeftBotColor = useMemo(
    () => {
      const setting = collisionSettings.find(s => s.key == "slope_22_left_bot");
      return setting ? setting.color : slopeColor;
    },
    [collisionSettings, collisionAlpha]
  );

  const spareColors = useMemo(
    () => ["08","09","10","11","12","13","14","15"].map(i => {
      const setting = collisionSettings.find(s => s.key == ("spare_"+i));
      return setting ? setting.color : "#00800080";
    }),
    [collisionSettings, collisionAlpha]
  );

  const spareSymbols = useMemo(
    () => ["08","09","10","11","12","13","14","15"].map(i => {
      const setting = collisionSettings.find(s => s.key == ("spare_"+i));
      return setting && setting.name ? setting.name[0] : COLLISIONS_EXTRA_SYMBOLS[+i-8];
    }),
    [collisionSettings, collisionAlpha]
  );


  useEffect(() => {
    if (canvas.current) {
      // eslint-disable-next-line no-self-assign
      canvas.current.width = canvas.current.width; // Clear canvas
      const ctx = canvas.current.getContext("2d");
      
      if (!ctx) return;
      
      ctx.font = "8px Public Pixel";
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha =  collisionAlpha;

      for (let yi = 0; yi < height; yi++) {
        for (let xi = 0; xi < width; xi++) {
          const collisionIndex = width * yi + xi;
          const tile = collisions[collisionIndex];
          const tileprop = tile & TILE_PROPS;
          if ((tile & COLLISION_ALL) === COLLISION_ALL) {
            ctx.fillStyle = solidColor;
            ctx.fillRect(xi * TILE_SIZE, yi * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          } else if (tile !== 0) {
            if (tile & COLLISION_TOP) {
              ctx.fillStyle = topColor;
              ctx.fillRect(
                xi * TILE_SIZE,
                yi * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE * 0.5
              );
            }
            if (tile & COLLISION_BOTTOM) {
              ctx.fillStyle = bottomColor;
              ctx.fillRect(
                xi * TILE_SIZE,
                (yi + .5) * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE * 0.5
              );
            }
            if (tile & COLLISION_LEFT) {
              ctx.fillStyle = leftColor;
              ctx.fillRect(
                xi * TILE_SIZE,
                yi * TILE_SIZE,
                TILE_SIZE * 0.5,
                TILE_SIZE
              );
            }
            if (tile & COLLISION_RIGHT) {
              ctx.fillStyle = rightColor;
              ctx.fillRect(
                (xi + 0.5) * TILE_SIZE,
                yi * TILE_SIZE,
                TILE_SIZE * 0.5,
                TILE_SIZE
              );
            }
          }
          if (tileprop) {
            switch (tileprop) {
              case TILE_PROP_LADDER: // Ladder
                ctx.fillStyle = ladderColor
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
                ctx.fillStyle = slope45RightColor;
                ctx.beginPath();
                ctx.moveTo((xi + 0) * TILE_SIZE, (yi + 1) * TILE_SIZE);
                ctx.lineTo((xi + 1) * TILE_SIZE, (yi + 0) * TILE_SIZE);
                ctx.lineTo((xi + 1) * TILE_SIZE, (yi + 1) * TILE_SIZE);
                ctx.fill(); // Render the path
                break;
              case COLLISION_SLOPE_22_RIGHT_BOT: // slope right shalow BOT
                ctx.fillStyle = slope22RightBotColor;
                ctx.beginPath();
                ctx.moveTo((xi + 0) * TILE_SIZE, (yi + 1) * TILE_SIZE);
                ctx.lineTo((xi + 1) * TILE_SIZE, (yi + 0.5) * TILE_SIZE);
                ctx.lineTo((xi + 1) * TILE_SIZE, (yi + 1) * TILE_SIZE);
                ctx.fill(); // Render the path
                break;
              case COLLISION_SLOPE_22_RIGHT_TOP: // slope right shalow TOP
                ctx.fillStyle = slope22RightTopColor;
                ctx.beginPath();
                ctx.moveTo((xi + 0) * TILE_SIZE, (yi + 0.5) * TILE_SIZE);
                ctx.lineTo((xi + 1) * TILE_SIZE, (yi + 0) * TILE_SIZE);
                ctx.lineTo((xi + 1) * TILE_SIZE, (yi + 0.5) * TILE_SIZE);
                ctx.fill(); // Render the path
                break;
              case COLLISION_SLOPE_45_LEFT: // slope left
                ctx.fillStyle = slope45LeftColor;
                ctx.beginPath();
                ctx.moveTo((xi + 0) * TILE_SIZE, (yi + 0) * TILE_SIZE);
                ctx.lineTo((xi + 1) * TILE_SIZE, (yi + 1) * TILE_SIZE);
                ctx.lineTo((xi + 0) * TILE_SIZE, (yi + 1) * TILE_SIZE);
                ctx.fill(); // Render the path
                break;
              case COLLISION_SLOPE_22_LEFT_BOT: // slope left shalow BOT
                ctx.fillStyle = slope22LeftBotColor;
                ctx.beginPath();
                ctx.moveTo((xi + 1) * TILE_SIZE, (yi + 1) * TILE_SIZE);
                ctx.lineTo((xi + 0) * TILE_SIZE, (yi + 0.5) * TILE_SIZE);
                ctx.lineTo((xi + 0) * TILE_SIZE, (yi + 1) * TILE_SIZE);
                ctx.fill(); // Render the path
                break;
              case COLLISION_SLOPE_22_LEFT_TOP: // slope left shalow TOP
                ctx.fillStyle = slope22LeftTopColor;
                ctx.beginPath();
                ctx.moveTo((xi + 1) * TILE_SIZE, (yi + 0.5) * TILE_SIZE);
                ctx.lineTo((xi + 0) * TILE_SIZE, (yi + 0) * TILE_SIZE);
                ctx.lineTo((xi + 0) * TILE_SIZE, (yi + 0.5) * TILE_SIZE);
                ctx.fill(); // Render the path
                break;
              default:
                const tilepropValue = (tileprop >> 4) - 8;
                ctx.fillStyle = spareColors[tilepropValue];
                ctx.fillRect(
                  xi * TILE_SIZE,
                  yi * TILE_SIZE,
                  TILE_SIZE,
                  TILE_SIZE
                );
                ctx.fillStyle = "#FFFFFF40";
                ctx.fillText(
                  spareSymbols[tilepropValue],
                  xi * TILE_SIZE,
                  (yi + 0.9) * TILE_SIZE
                );
                break;
            }
          }
        }
      }
    }
  }, [collisions, height, width, collisionAlpha]);

  return (
    <canvas
      ref={canvas}
      width={width * TILE_SIZE}
      height={height * TILE_SIZE}
    />
  );
};

export default SceneCollisions;
