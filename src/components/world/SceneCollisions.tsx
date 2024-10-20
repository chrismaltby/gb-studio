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

  const collisionLayerOpacity = useAppSelector(
    (state) =>
      Math.floor(state.project.present.settings.collisionLayerOpacity) / 100
  );

  const collisionTileLabels = useAppSelector(
    (state) => state.project.present.settings.collisionTileLabels
  );

  const solidColor = useMemo(() => {
    const setting = collisionTileLabels.find((s) => s.key === "solid");
    return setting ? setting.color : "#FA2828FF";
  }, [collisionTileLabels]);

  const topColor = useMemo(() => {
    const setting = collisionTileLabels.find((s) => s.key === "top");
    return setting ? setting.color : "#2828FAFF";
  }, [collisionTileLabels]);

  const bottomColor = useMemo(() => {
    const setting = collisionTileLabels.find((s) => s.key === "bottom");
    return setting ? setting.color : "#FFFA28FF";
  }, [collisionTileLabels]);

  const leftColor = useMemo(() => {
    const setting = collisionTileLabels.find((s) => s.key === "left");
    return setting ? setting.color : "#FA28FAFF";
  }, [collisionTileLabels]);

  const rightColor = useMemo(() => {
    const setting = collisionTileLabels.find((s) => s.key === "right");
    return setting ? setting.color : "#28FAFAFF";
  }, [collisionTileLabels]);

  const ladderColor = useMemo(() => {
    const setting = collisionTileLabels.find((s) => s.key === "ladder");
    return setting ? setting.color : "#008000FF";
  }, [collisionTileLabels]);

  const slopeColor = "#0000FFFF";
  const slope45RightColor = useMemo(() => {
    const setting = collisionTileLabels.find((s) => s.key === "slope_45_right");
    return setting ? setting.color : slopeColor;
  }, [collisionTileLabels]);

  const slope45LeftColor = useMemo(() => {
    const setting = collisionTileLabels.find((s) => s.key === "slope_45_left");
    return setting ? setting.color : slopeColor;
  }, [collisionTileLabels]);

  const slope22RightBotColor = useMemo(() => {
    const setting = collisionTileLabels.find(
      (s) => s.key === "slope_22_right_bot"
    );
    return setting ? setting.color : slopeColor;
  }, [collisionTileLabels]);

  const slope22RightTopColor = useMemo(() => {
    const setting = collisionTileLabels.find(
      (s) => s.key === "slope_22_right_top"
    );
    return setting ? setting.color : slopeColor;
  }, [collisionTileLabels]);

  const slope22LeftTopColor = useMemo(() => {
    const setting = collisionTileLabels.find(
      (s) => s.key === "slope_22_left_top"
    );
    return setting ? setting.color : slopeColor;
  }, [collisionTileLabels]);

  const slope22LeftBotColor = useMemo(() => {
    const setting = collisionTileLabels.find(
      (s) => s.key === "slope_22_left_bot"
    );
    return setting ? setting.color : slopeColor;
  }, [collisionTileLabels]);

  const spareColors = useMemo(
    () =>
      ["08", "09", "10", "11", "12", "13", "14", "15"].map((i) => {
        const setting = collisionTileLabels.find((s) => s.key === "spare_" + i);
        return setting ? setting.color : "#00800080";
      }),
    [collisionTileLabels]
  );

  const spareSymbols = useMemo(
    () =>
      ["08", "09", "10", "11", "12", "13", "14", "15"].map((i) => {
        const setting = collisionTileLabels.find((s) => s.key === "spare_" + i);
        return setting && setting.icon
          ? setting.icon[0]
          : COLLISIONS_EXTRA_SYMBOLS[+i - 8];
      }),
    [collisionTileLabels]
  );

  const letters = useMemo(
    () =>
      collisionTileLabels.map((s) =>
        s.icon && s.icon.length > 0 ? s.icon[0] : undefined
      ),
    [collisionTileLabels]
  );

  const drawLetter = (
    letter: string,
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ) => {
    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    const c = ctx.fillStyle as string;
    const tileAlpha = c.length < 8 ? 1.0 : Number("0x" + c.slice(7, 9)) / 255.0;
    ctx.fillStyle = tileAlpha < 0.5 ? c.slice(0, 7) + "FF" : "#FFFFFFFF";
    ctx.fillText(letter, x * TILE_SIZE, (y + 0.9) * TILE_SIZE);
  };

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
            ctx.fillStyle = solidColor;
            if (letters[0]) drawLetter(letters[0], ctx, xi, yi);
            else
              ctx.fillRect(
                xi * TILE_SIZE,
                yi * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE
              );
          } else if (tile !== 0) {
            if (tile & COLLISION_TOP) {
              ctx.fillStyle = topColor;
              if (letters[1]) drawLetter(letters[1], ctx, xi, yi);
              else
                ctx.fillRect(
                  xi * TILE_SIZE,
                  yi * TILE_SIZE,
                  TILE_SIZE,
                  TILE_SIZE * 0.375
                );
            }
            if (tile & COLLISION_BOTTOM) {
              ctx.fillStyle = bottomColor;
              if (letters[2]) drawLetter(letters[2], ctx, xi, yi);
              else
                ctx.fillRect(
                  xi * TILE_SIZE,
                  (yi + 0.625) * TILE_SIZE,
                  TILE_SIZE,
                  TILE_SIZE * 0.375
                );
            }
            if (tile & COLLISION_LEFT) {
              ctx.fillStyle = leftColor;
              if (letters[3]) drawLetter(letters[3], ctx, xi, yi);
              else
                ctx.fillRect(
                  xi * TILE_SIZE,
                  yi * TILE_SIZE,
                  TILE_SIZE * 0.375,
                  TILE_SIZE
                );
            }
            if (tile & COLLISION_RIGHT) {
              ctx.fillStyle = rightColor;
              if (letters[4]) drawLetter(letters[4], ctx, xi, yi);
              else
                ctx.fillRect(
                  (xi + 0.625) * TILE_SIZE,
                  yi * TILE_SIZE,
                  TILE_SIZE * 0.375,
                  TILE_SIZE
                );
            }
          }
          if (tileprop) {
            switch (tileprop) {
              case TILE_PROP_LADDER: // Ladder
                ctx.fillStyle = ladderColor;
                if (letters[5]) drawLetter(letters[5], ctx, xi, yi);
                else {
                  ctx.fillRect(
                    (xi + 0.0) * TILE_SIZE,
                    yi * TILE_SIZE,
                    TILE_SIZE * 0.25,
                    TILE_SIZE
                  );
                  ctx.fillRect(
                    (xi + 0.75) * TILE_SIZE,
                    yi * TILE_SIZE,
                    TILE_SIZE * 0.25,
                    TILE_SIZE
                  );
                  ctx.fillRect(
                    xi * TILE_SIZE,
                    (yi + 0.125) * TILE_SIZE,
                    TILE_SIZE,
                    TILE_SIZE * 0.25
                  );
                  ctx.fillRect(
                    xi * TILE_SIZE,
                    (yi + 0.625) * TILE_SIZE,
                    TILE_SIZE,
                    TILE_SIZE * 0.25
                  );
                }
                break;
              case COLLISION_SLOPE_45_RIGHT: // slope right
                ctx.fillStyle = slope45RightColor;
                if (letters[6]) drawLetter(letters[6], ctx, xi, yi);
                else {
                  ctx.beginPath();
                  ctx.moveTo((xi + 0) * TILE_SIZE, (yi + 1) * TILE_SIZE);
                  ctx.lineTo((xi + 1) * TILE_SIZE, (yi + 0) * TILE_SIZE);
                  ctx.lineTo((xi + 1) * TILE_SIZE, (yi + 1) * TILE_SIZE);
                  ctx.fill(); // Render the path
                }
                break;
              case COLLISION_SLOPE_22_RIGHT_BOT: // slope right shalow BOT
                ctx.fillStyle = slope22RightBotColor;
                if (letters[7]) drawLetter(letters[7], ctx, xi, yi);
                else {
                  ctx.beginPath();
                  ctx.moveTo((xi + 0) * TILE_SIZE, (yi + 1) * TILE_SIZE);
                  ctx.lineTo((xi + 1) * TILE_SIZE, (yi + 0.5) * TILE_SIZE);
                  ctx.lineTo((xi + 1) * TILE_SIZE, (yi + 1) * TILE_SIZE);
                  ctx.fill(); // Render the path
                }
                break;
              case COLLISION_SLOPE_22_RIGHT_TOP: // slope right shalow TOP
                ctx.fillStyle = slope22RightTopColor;
                if (letters[8]) drawLetter(letters[8], ctx, xi, yi);
                else {
                  ctx.beginPath();
                  ctx.moveTo((xi + 0) * TILE_SIZE, (yi + 0.5) * TILE_SIZE);
                  ctx.lineTo((xi + 1) * TILE_SIZE, (yi + 0) * TILE_SIZE);
                  ctx.lineTo((xi + 1) * TILE_SIZE, (yi + 0.5) * TILE_SIZE);
                  ctx.fill(); // Render the path
                }
                break;
              case COLLISION_SLOPE_45_LEFT: // slope left
                ctx.fillStyle = slope45LeftColor;
                if (letters[9]) drawLetter(letters[9], ctx, xi, yi);
                else {
                  ctx.beginPath();
                  ctx.moveTo((xi + 0) * TILE_SIZE, (yi + 0) * TILE_SIZE);
                  ctx.lineTo((xi + 1) * TILE_SIZE, (yi + 1) * TILE_SIZE);
                  ctx.lineTo((xi + 0) * TILE_SIZE, (yi + 1) * TILE_SIZE);
                  ctx.fill(); // Render the path
                }
                break;
              case COLLISION_SLOPE_22_LEFT_BOT: // slope left shalow BOT
                ctx.fillStyle = slope22LeftBotColor;
                if (letters[10]) drawLetter(letters[10], ctx, xi, yi);
                else {
                  ctx.beginPath();
                  ctx.moveTo((xi + 1) * TILE_SIZE, (yi + 1) * TILE_SIZE);
                  ctx.lineTo((xi + 0) * TILE_SIZE, (yi + 0.5) * TILE_SIZE);
                  ctx.lineTo((xi + 0) * TILE_SIZE, (yi + 1) * TILE_SIZE);
                  ctx.fill(); // Render the path
                }
                break;
              case COLLISION_SLOPE_22_LEFT_TOP: // slope left shalow TOP
                ctx.fillStyle = slope22LeftTopColor;
                if (letters[11]) drawLetter(letters[11], ctx, xi, yi);
                else {
                  ctx.beginPath();
                  ctx.moveTo((xi + 1) * TILE_SIZE, (yi + 0.5) * TILE_SIZE);
                  ctx.lineTo((xi + 0) * TILE_SIZE, (yi + 0) * TILE_SIZE);
                  ctx.lineTo((xi + 0) * TILE_SIZE, (yi + 0.5) * TILE_SIZE);
                  ctx.fill(); // Render the path
                }
                break;
              default:
                const tilepropValue = (tileprop >> 4) - 8;
                ctx.fillStyle = spareColors[tilepropValue];
                drawLetter(spareSymbols[tilepropValue], ctx, xi, yi);
                break;
            }
          }
        }
      }
    }
  }, [
    bottomColor,
    collisions,
    height,
    ladderColor,
    leftColor,
    letters,
    rightColor,
    slope22LeftBotColor,
    slope22LeftTopColor,
    slope22RightBotColor,
    slope22RightTopColor,
    slope45LeftColor,
    slope45RightColor,
    solidColor,
    spareColors,
    spareSymbols,
    topColor,
    width,
  ]);

  return (
    <canvas
      ref={canvas}
      width={width * TILE_SIZE}
      height={height * TILE_SIZE}
      style={{
        opacity: collisionLayerOpacity,
      }}
    />
  );
};

export default SceneCollisions;
