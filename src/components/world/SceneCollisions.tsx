import React, { useEffect, useRef } from "react";
import { useAppSelector } from "store/hooks";
import { CollisionTileLabel } from "shared/lib/resources/types";
import {
  defaultCollisionTileColor,
  defaultCollisionTileIcon,
  defaultCollisionTileLabels,
} from "consts";
import { renderCollisionTileIcon } from "shared/lib/collisions/collisionTileIcon";

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
    const sceneType = state.engine.sceneTypes.find(
      (s) => s.key === sceneTypeKey
    );
    if (sceneType && sceneType.collisionTileLabels)
      return sceneType.collisionTileLabels;
    return defaultCollisionTileLabels;
  });

  const drawCollisionTile = (
    tile: CollisionTileLabel,
    ctx: CanvasRenderingContext2D,
    xi: number,
    yi: number
  ) => {
    const tileIcon = renderCollisionTileIcon(
      tile.icon ?? defaultCollisionTileIcon,
      tile.color ?? defaultCollisionTileColor
    );
    ctx.drawImage(tileIcon, xi * TILE_SIZE, yi * TILE_SIZE);
  };

  useEffect(() => {
    if (canvas.current) {
      // eslint-disable-next-line no-self-assign
      canvas.current.width = canvas.current.width; // Clear canvas
      const ctx = canvas.current.getContext("2d");

      if (!ctx) return;

      const sortedTiles = collisionTileLabels.map((t) => t);
      sortedTiles.sort((a, b) => {
        if (a.mask) {
          if (b.mask) {
            const aCount = a.mask.toString(2).split("1").length - 1;
            const bCount = b.mask.toString(2).split("1").length - 1;
            if (aCount > bCount) return -1;
            else if (bCount > aCount) return 1;
          } else return 1;
        } else if (b.mask) return -1;

        const aCount = a.flag.toString(2).split("1").length - 1;
        const bCount = b.flag.toString(2).split("1").length - 1;
        return bCount - aCount;
      });

      for (let yi = 0; yi < height; yi++) {
        for (let xi = 0; xi < width; xi++) {
          const collisionIndex = width * yi + xi;
          const tile = collisions[collisionIndex];

          let bitsUsed = 0;
          for (const tileLabel of sortedTiles) {
            const mask = tileLabel.mask ? tileLabel.mask : tileLabel.flag;
            if ((bitsUsed & mask) === 0 && (tile & mask) === tileLabel.flag) {
              ctx.fillStyle = tileLabel.color;
              drawCollisionTile(tileLabel, ctx, xi, yi);
              bitsUsed |= mask;
            }
          }
        }
      }
    }
  }, [collisionTileLabels, collisions, height, width]);

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
