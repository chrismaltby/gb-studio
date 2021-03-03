import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { DMG_PALETTE } from "../../../consts";
import { assetFilename } from "../../../lib/helpers/gbstudio";
import { RootState } from "../../../store/configureStore";
import {
  metaspriteSelectors,
  metaspriteTileSelectors,
  spriteSheetSelectors,
} from "../../../store/features/entities/entitiesState";
import MetaspriteCanvasWorker from "./MetaspriteCanvas.worker";

interface MetaspriteCanvasProps {
  spriteSheetId: string;
  metaspriteId: string;
  flipX?: boolean;
}

const worker = new MetaspriteCanvasWorker();

export const MetaspriteCanvas = ({
  spriteSheetId,
  metaspriteId,
  flipX = false,
}: MetaspriteCanvasProps) => {
  const [workerId] = useState(Math.random());
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const spriteSheet = useSelector((state: RootState) =>
    spriteSheetSelectors.selectById(state, spriteSheetId)
  );
  const metasprite = useSelector((state: RootState) =>
    metaspriteSelectors.selectById(state, metaspriteId)
  );
  const tilesLookup = useSelector((state: RootState) =>
    metaspriteTileSelectors.selectEntities(state)
  );
  const projectRoot = useSelector((state: RootState) => state.document.root);
  const width = spriteSheet?.canvasWidth || 0;
  const height = spriteSheet?.canvasHeight || 0;
  const tiles = metasprite?.tiles
    ?.map((tileId) => tilesLookup[tileId])
    .filter((i) => i);

  const onWorkerComplete = useCallback((e: any) => {
    if (e.data.id === workerId) {
      const offscreenCanvas = document.createElement("canvas");
      const offscreenCtx = offscreenCanvas.getContext("bitmaprenderer");
      if (!canvasRef.current || !spriteSheet || !offscreenCtx) {
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
  }, []);

  useEffect(() => {
    worker.addEventListener("message", onWorkerComplete);
    return () => {
      worker.removeEventListener("message", onWorkerComplete);
    };
  }, [width, height, onWorkerComplete]);

  useEffect(() => {
    if (!canvasRef.current || !spriteSheet) {
      return;
    }
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) {
      return;
    }
    const filename = `file://${assetFilename(
      projectRoot,
      "sprites",
      spriteSheet
    )}?_v=${spriteSheet._v}`;

    worker.postMessage({
      id: workerId,
      src: filename,
      width,
      height,
      tiles,
      flipX,
      palette: DMG_PALETTE.colors,
    });
  }, [canvasRef, spriteSheet, width, height, tiles, projectRoot, workerId]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ imageRendering: "pixelated" }}
    />
  );
};
