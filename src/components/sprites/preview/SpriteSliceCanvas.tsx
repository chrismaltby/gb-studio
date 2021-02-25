import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { DMG_PALETTE } from "../../../consts";
import { assetFilename } from "../../../lib/helpers/gbstudio";
import { RootState } from "../../../store/configureStore";
import { spriteSheetSelectors } from "../../../store/features/entities/entitiesState";
import { ObjPalette } from "../../../store/features/entities/entitiesTypes";
import SpriteSliceCanvasWorker from "./SpriteSliceCanvas.worker";

interface SpriteSliceCanvasProps {
  spriteSheetId: string;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  flipX?: boolean;
  flipY?: boolean;
  objPalette: ObjPalette;
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
}: SpriteSliceCanvasProps) => {
  const [workerId] = useState(Math.random());
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const spriteSheet = useSelector((state: RootState) =>
    spriteSheetSelectors.selectById(state, spriteSheetId)
  );
  const projectRoot = useSelector((state: RootState) => state.document.root);

  useEffect(() => {
    worker.addEventListener("message", onWorkerComplete);
    return () => {
      worker.removeEventListener("message", onWorkerComplete);
    };
  }, [width, height]);

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
      objPalette,
      palette: DMG_PALETTE.colors,
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
    projectRoot,
    workerId,
  ]);

  const onWorkerComplete = (e: any) => {
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
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ imageRendering: "pixelated" }}
    />
  );
};
