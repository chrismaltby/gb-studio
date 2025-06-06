import React, { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import { DMG_PALETTE, TILE_SIZE } from "consts";
import { tilesetSelectors } from "store/features/entities/entitiesState";
import TilePreviewWorker, { TilePreviewResult } from "./TilePreview.worker";
import { assetURL } from "shared/lib/helpers/assets";
import { GridUnitType } from "shared/lib/entities/entitiesTypes";

interface TileCanvasProps {
  tilesetId: string;
  tileIndex?: number;
  tileSize?: GridUnitType;
}

const worker = new TilePreviewWorker();

export const TileCanvas = ({
  tilesetId,
  tileIndex,
  tileSize,
}: TileCanvasProps) => {
  const size = tileSize === "16px" ? 2 : 1;
  const width = TILE_SIZE * size;
  const height = TILE_SIZE * size;
  const [workerId] = useState(Math.random());
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const tileset = useAppSelector(
    (state) =>
      tilesetSelectors.selectById(state, tilesetId) ??
      tilesetSelectors.selectAll(state)[0],
  );

  const onWorkerComplete = useCallback(
    (e: MessageEvent<TilePreviewResult>) => {
      if (e.data.id === workerId) {
        const offscreenCanvas = document.createElement("canvas");
        const offscreenCtx = offscreenCanvas.getContext("bitmaprenderer");
        if (!canvasRef.current || !tileset || !offscreenCtx) {
          return;
        }
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) {
          return;
        }
        offscreenCtx.transferFromImageBitmap(e.data.canvasImage);
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(offscreenCanvas, 0, 0);
      }
    },
    [height, tileset, width, workerId],
  );

  useEffect(() => {
    worker.addEventListener("message", onWorkerComplete);
    return () => {
      worker.removeEventListener("message", onWorkerComplete);
    };
  }, [onWorkerComplete]);

  useEffect(() => {
    if (!canvasRef.current || !tileset) {
      return;
    }
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) {
      return;
    }
    const tilesetURL = assetURL("tilesets", tileset);

    worker.postMessage({
      id: workerId,
      src: tilesetURL,
      palette: DMG_PALETTE.colors,
      tileIndex,
      tileSize,
    });
  }, [canvasRef, tileIndex, tileSize, tileset, workerId]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ imageRendering: "pixelated", width: 16 }}
    />
  );
};
