import React, { useEffect, useRef } from "react";
import { useAppSelector } from "store/hooks";
import { CollisionTileLabel } from "shared/lib/resources/types";
import { defaultCollisionTileLabels } from "consts";

const TILE_SIZE = 8;

interface SceneCollisionsProps {
  width: number;
  height: number;
  collisions: number[];
  sceneTypeKey: string;
}

const SceneCollisions = ({
  width,
  height,
  collisions,
  sceneTypeKey,
}: SceneCollisionsProps) => {
  const canvas = useRef<HTMLCanvasElement>(null);

  const collisionLayerOpacity = useAppSelector(
    (state) =>
      Math.floor(state.project.present.settings.collisionLayerOpacity) / 100
  );

  const collisionTileLabels = useAppSelector((state) => {
    const sceneType = state.engine.sceneTypes.find(s => s.key == sceneTypeKey); 
    if (sceneType && sceneType.collisionTileLabels) return sceneType.collisionTileLabels;
    return defaultCollisionTileLabels;
  });

  const drawLetter = (
    letter: string,
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ) => {
    // ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    // const c = ctx.fillStyle as string;
    // const tileAlpha = c.length < 8 ? 1.0 : Number("0x" + c.slice(7, 9)) / 255.0;
    // ctx.fillStyle = tileAlpha < 0.5 ? c.slice(0, 7) + "FF" : "#FFFFFFFF";
    ctx.fillText(letter, x * TILE_SIZE, (y + 0.9) * TILE_SIZE);
  };

  const drawCollisionTile = (
    tile: CollisionTileLabel,
    ctx: CanvasRenderingContext2D,
    xi: number,
    yi: number
  ) => {
    if (tile.icon) {
      drawLetter(tile.icon[0], ctx, xi, yi);
      return;
    }

    switch (tile.key) {
      case "solid":
        ctx.fillRect(
          xi * TILE_SIZE,
          yi * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE
        );
        return;

      case "top":
        ctx.fillRect(
          xi * TILE_SIZE,
          yi * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE * 0.375
        );
        return;

      case "bottom":
        ctx.fillRect(
          xi * TILE_SIZE,
          (yi + 0.625) * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE * 0.375
        );
        return;

      case "left":
        ctx.fillRect(
          xi * TILE_SIZE,
          yi * TILE_SIZE,
          TILE_SIZE * 0.375,
          TILE_SIZE
        );
        return;

      case "right":
        ctx.fillRect(
          (xi + 0.625) * TILE_SIZE,
          yi * TILE_SIZE,
          TILE_SIZE * 0.375,
          TILE_SIZE
        );
        return;
        
      case "ladder":
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
        return;

      case "slope_45_right":
        ctx.beginPath();
        ctx.moveTo((xi + 0) * TILE_SIZE, (yi + 1) * TILE_SIZE);
        ctx.lineTo((xi + 1) * TILE_SIZE, (yi + 0) * TILE_SIZE);
        ctx.lineTo((xi + 1) * TILE_SIZE, (yi + 1) * TILE_SIZE);
        ctx.fill(); 
        return;
              
      case "slope_22_right_bot":
        ctx.beginPath();
        ctx.moveTo((xi + 0) * TILE_SIZE, (yi + 1) * TILE_SIZE);
        ctx.lineTo((xi + 1) * TILE_SIZE, (yi + 0.5) * TILE_SIZE);
        ctx.lineTo((xi + 1) * TILE_SIZE, (yi + 1) * TILE_SIZE);
        ctx.fill();
        return;
          
      case "slope_22_right_top":
        ctx.moveTo((xi + 0) * TILE_SIZE, (yi + 0.5) * TILE_SIZE);
        ctx.lineTo((xi + 1) * TILE_SIZE, (yi + 0) * TILE_SIZE);
        ctx.lineTo((xi + 1) * TILE_SIZE, (yi + 0.5) * TILE_SIZE);
        ctx.fill(); 
        return;

      case "slope_45_left":
        ctx.beginPath();
        ctx.moveTo((xi + 0) * TILE_SIZE, (yi + 0) * TILE_SIZE);
        ctx.lineTo((xi + 1) * TILE_SIZE, (yi + 1) * TILE_SIZE);
        ctx.lineTo((xi + 0) * TILE_SIZE, (yi + 1) * TILE_SIZE);
        ctx.fill(); 
        return;
          
      case "slope_22_left_bot":
        ctx.beginPath();
        ctx.moveTo((xi + 1) * TILE_SIZE, (yi + 1) * TILE_SIZE);
        ctx.lineTo((xi + 0) * TILE_SIZE, (yi + 0.5) * TILE_SIZE);
        ctx.lineTo((xi + 0) * TILE_SIZE, (yi + 1) * TILE_SIZE);
        ctx.fill(); 
        return;

      case "slope_22_left_top":
        ctx.beginPath();
        ctx.moveTo((xi + 1) * TILE_SIZE, (yi + 0.5) * TILE_SIZE);
        ctx.lineTo((xi + 0) * TILE_SIZE, (yi + 0) * TILE_SIZE);
        ctx.lineTo((xi + 0) * TILE_SIZE, (yi + 0.5) * TILE_SIZE);
        ctx.fill();
        return;
      
      case "spare_08":
        drawLetter("8", ctx, xi, yi);
        return;
        
      case "spare_09":
        drawLetter("9", ctx, xi, yi);
        return;
        
      case "spare_10":
        drawLetter("A", ctx, xi, yi);
        return;
        
      case "spare_11":
        drawLetter("B", ctx, xi, yi);
        return;
        
      case "spare_12":
        drawLetter("C", ctx, xi, yi);
        return;
        
      case "spare_13":
        drawLetter("D", ctx, xi, yi);
        return;
        
      case "spare_14":
        drawLetter("E", ctx, xi, yi);
        return;
        
      case "spare_15":
        drawLetter("F", ctx, xi, yi);
        return;
        
      default:
        drawLetter(" ", ctx, xi, yi);
        return;
    }
  }

  useEffect(() => {
    if (canvas.current) {
      // eslint-disable-next-line no-self-assign
      canvas.current.width = canvas.current.width; // Clear canvas
      const ctx = canvas.current.getContext("2d");

      if (!ctx) return;

      ctx.font = "8px Public Pixel";

      let sortedTiles = collisionTileLabels.map(t => t);
      sortedTiles.sort((a, b) => {
        if (a.mask) {
          if (b.mask) {
            const aCount = a.mask.toString(2).split("1").length-1;
            const bCount = b.mask.toString(2).split("1").length-1;
            if (aCount > bCount) return -1;
            else if (bCount > aCount) return 1;
          }
          else return 1;
        }
        else if (b.mask) return -1;
        
        const aCount = a.flag.toString(2).split("1").length-1;
        const bCount = b.flag.toString(2).split("1").length-1;
        return bCount - aCount;
      });
      
      for (let yi = 0; yi < height; yi++) {
        for (let xi = 0; xi < width; xi++) {
          const collisionIndex = width * yi + xi;
          const tile = collisions[collisionIndex];

          let bitsUsed = 0;
          for (var tileLabel of sortedTiles) {
            const mask = tileLabel.mask ? tileLabel.mask : tileLabel.flag;
            if ((bitsUsed & mask) === 0 &&(tile & mask) === tileLabel.flag) {
              ctx.fillStyle = tileLabel.color;
              drawCollisionTile(tileLabel, ctx, xi, yi);
              bitsUsed |= mask;
            }
          }
        }
      }
    }
  }, [
    collisions,
    height,
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
