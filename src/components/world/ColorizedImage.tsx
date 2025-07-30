import React, { useCallback, useEffect, useRef } from "react";
import { Palette } from "shared/lib/entities/entitiesTypes";
import ColorizedImageWorker, {
  ColorizedImageResult,
} from "./ColorizedImage.worker";
import { getSettings } from "store/features/settings/settingsState";
import { useAppSelector } from "store/hooks";

const workerPool: ColorizedImageWorker[] = [];
for (let i = 0; i < navigator.hardwareConcurrency; i++) {
  workerPool.push(new ColorizedImageWorker());
}

interface ColorizedImageProps {
  width: number;
  height: number;
  src: string;
  tiles: number[];
  palettes: Palette[];
  previewAsMono?: boolean;
}

const ColorizedImage = ({
  width,
  height,
  src,
  tiles,
  palettes,
  previewAsMono,
}: ColorizedImageProps) => {
  const colorCorrection = useAppSelector(
    (state) => getSettings(state).colorCorrection,
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerId = useRef(Math.random());
  const worker = useRef(
    workerPool[Math.floor(workerPool.length * Math.random())],
  );

  const onWorkerComplete = useCallback(
    (e: MessageEvent<ColorizedImageResult>) => {
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
        palettes: palettes.map((p) => p.colors),
        tiles,
        width,
        height,
        previewAsMono,
        colorCorrection,
        id: workerId.current,
      });
    }
  }, [height, palettes, previewAsMono, colorCorrection, src, tiles, width]);

  return <canvas ref={canvasRef} width={width} height={height} />;
};

export default ColorizedImage;
