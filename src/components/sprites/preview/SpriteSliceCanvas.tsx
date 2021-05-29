import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { DMG_PALETTE } from "../../../consts";
import { assetFilename } from "lib/helpers/gbstudio";
import { RootState } from "store/configureStore";
import { spriteSheetSelectors } from "store/features/entities/entitiesState";
import { ObjPalette, Palette } from "store/features/entities/entitiesTypes";
import SpriteSliceCanvasWorker, {
  SpriteSliceCanvasResult,
} from "./SpriteSliceCanvas.worker";

interface SpriteSliceCanvasProps {
  spriteSheetId: string;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  flipX?: boolean;
  flipY?: boolean;
  objPalette: ObjPalette;
  palette?: Palette;
}

const worker = new SpriteSliceCanvasWorker();

export const SpriteSliceCanvas = ({
  spriteSheetId,
  offsetX,
  offsetY,
  width,
  height,
  flipX,
  flipY,
  objPalette,
  palette,
}: SpriteSliceCanvasProps) => {
  const [workerId] = useState(Math.random());
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const spriteSheet = useSelector((state: RootState) =>
    spriteSheetSelectors.selectById(state, spriteSheetId)
  );
  const projectRoot = useSelector((state: RootState) => state.document.root);

  const onWorkerComplete = useCallback(
    (e: MessageEvent<SpriteSliceCanvasResult>) => {
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
    },
    [height, spriteSheet, width, workerId]
  );

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
      offsetX,
      offsetY,
      width,
      height,
      flipX,
      flipY,
      objPalette: palette ? "OBP0" : objPalette,
      palette: (palette || DMG_PALETTE).colors,
    });
  }, [
    canvasRef,
    spriteSheet,
    offsetX,
    offsetY,
    width,
    height,
    flipX,
    flipY,
    objPalette,
    palette,
    projectRoot,
    workerId,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ imageRendering: "pixelated" }}
    />
  );
};
