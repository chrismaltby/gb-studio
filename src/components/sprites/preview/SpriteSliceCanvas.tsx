import React, { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import { DMG_PALETTE } from "consts";
import { spriteSheetSelectors } from "store/features/entities/entitiesState";
import { ObjPalette, Palette } from "shared/lib/entities/entitiesTypes";
import SpriteSliceCanvasWorker, {
  SpriteSliceCanvasResult,
} from "./SpriteSliceCanvas.worker";
import { assetURL } from "shared/lib/helpers/assets";
import { getSettings } from "store/features/settings/settingsState";

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
  const spriteSheet = useAppSelector((state) =>
    spriteSheetSelectors.selectById(state, spriteSheetId),
  );
  const colorCorrection = useAppSelector(
    (state) => getSettings(state).colorCorrection,
  );

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
    [height, spriteSheet, width, workerId],
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
    const spriteURL = assetURL("sprites", spriteSheet);

    worker.postMessage({
      id: workerId,
      src: spriteURL,
      offsetX,
      offsetY,
      width,
      height,
      flipX,
      flipY,
      objPalette: palette ? "OBP0" : objPalette,
      palette: (palette || DMG_PALETTE).colors,
      colorCorrection,
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
    colorCorrection,
    workerId,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: "absolute",
        imageRendering: "pixelated",
      }}
    />
  );
};
