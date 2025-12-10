import React, { useCallback, useEffect, useRef } from "react";
import AutoColorizedImageWorker, {
  AutoColorizedImageResult,
} from "./AutoColorizedImage.worker";
import { getSettings } from "store/features/settings/settingsState";
import { useAppSelector } from "store/hooks";
import { Palette } from "shared/lib/resources/types";

const workerPool: AutoColorizedImageWorker[] = [];
for (let i = 0; i < navigator.hardwareConcurrency; i++) {
  workerPool.push(new AutoColorizedImageWorker());
}

interface AutoColorizedImageProps {
  width: number;
  height: number;
  src: string;
  tilesSrc?: string;
  uiPalette?: Palette;
  previewAsMono?: boolean;
}

const AutoColorizedImage = ({
  width,
  height,
  src,
  tilesSrc,
  uiPalette,
  previewAsMono,
}: AutoColorizedImageProps) => {
  const colorCorrection = useAppSelector(
    (state) => getSettings(state).colorCorrection,
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerId = useRef(Math.random());
  const worker = useRef(
    workerPool[Math.floor(workerPool.length * Math.random())],
  );

  const onWorkerComplete = useCallback(
    (e: MessageEvent<AutoColorizedImageResult>) => {
      if (e.data.id === workerId.current) {
        const offscreenCanvas = document.createElement("canvas");
        const offscreenCtx = offscreenCanvas.getContext("bitmaprenderer");
        if (!canvasRef.current || !offscreenCtx) {
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
    [height, width],
  );

  useEffect(() => {
    const theWorker = worker.current;
    theWorker.addEventListener("message", onWorkerComplete);
    return () => {
      theWorker.removeEventListener("message", onWorkerComplete);
    };
  }, [width, height, onWorkerComplete]);

  useEffect(() => {
    if (canvasRef.current && worker.current) {
      worker.current.postMessage({
        src,
        tilesSrc,
        width,
        height,
        previewAsMono,
        colorCorrection,
        uiPalette: uiPalette ? uiPalette.colors : undefined,
        id: workerId.current,
      });
    }
  }, [height, src, tilesSrc, width, previewAsMono, colorCorrection, uiPalette]);

  return <canvas ref={canvasRef} width={width} height={height} />;
};

export default AutoColorizedImage;
